import { createHash } from "node:crypto";
import { defineMiddleware } from "astro:middleware";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/i18n/config";
import { currentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/seo";

const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;
const dev = import.meta.env.DEV;

/**
 * Content-Security-Policy for one HTML page. Scripts run only from this site ('self': the island and page
 * bundles in /_astro) or if they are one of the page's own inline scripts, allowed by their SHA-256 hash
 * (the theme script and Astro's island loader). An injected inline script has no matching hash and is blocked.
 * Styles still allow inline (style attributes set by the experiments). Report-only unless CSP_ENFORCE=1;
 * violations are logged by /api/csp-report.
 */
function contentSecurityPolicy(html: string): string {
  const hashes = new Set<string>();
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (m[1]) hashes.add(`'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
  }
  return [
    "default-src 'self'",
    `script-src 'self' ${[...hashes].join(" ")}${dev ? " 'unsafe-inline' 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join("; ");
}

function securityHeaders(headers: Headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // HSTS only when the site is really served over HTTPS; browsers ignore it over plain HTTP.
  if (!dev && SITE_URL.startsWith("https://")) headers.set("Strict-Transport-Security", "max-age=15552000");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const first = pathname.split("/")[1];

  // Pages without a language prefix go to the reader's language: the cookie, else Accept-Language.
  const bypass = pathname.startsWith("/api/") || pathname.startsWith("/_") || pathname === "/404" || PUBLIC_FILE.test(pathname);
  if (!bypass && !isLocale(first)) {
    const cookie = context.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookie) ? cookie : negotiateLocale(context.request.headers.get("accept-language"));
    const url = new URL(context.url);
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return context.redirect(url.pathname + url.search, 307);
  }

  context.locals.locale = isLocale(first) ? first : "zh";
  context.locals.user = await currentUser(context.cookies);
  if (isLocale(first) && context.cookies.get(LOCALE_COOKIE)?.value !== first) {
    context.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  const response = await next();
  const headers = new Headers(response.headers);
  securityHeaders(headers);
  if (!(headers.get("content-type") ?? "").startsWith("text/html")) {
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  // The policy lists the hashes of this page's inline scripts, so the whole page is read first.
  const html = await response.text();
  headers.set(process.env.CSP_ENFORCE === "1" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", contentSecurityPolicy(html));
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
