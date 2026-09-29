import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/i18n/config";

const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;

/**
 * Content-Security-Policy with a fresh nonce per request. Scripts run only if they carry the nonce
 * (Next.js adds it to its own scripts when it sees the policy on the request; the layout adds it to the
 * theme script) or are loaded by such a script ('strict-dynamic'). Styles still allow inline, for KaTeX.
 * Report-only unless CSP_ENFORCE=1; violations are logged by /api/csp-report.
 */
function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const nonce = btoa(crypto.randomUUID());
    const policy = contentSecurityPolicy(nonce);
    const header = process.env.CSP_ENFORCE === "1" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set(header, policy);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(header, policy);
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie)
    ? cookie
    : negotiateLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
