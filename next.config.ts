import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leomath.cn";
const production = process.env.NODE_ENV === "production";
const https = siteUrl.startsWith("https://");
// Start in report-only mode; set CSP_ENFORCE=1 once the server log shows no violations.
const enforce = process.env.CSP_ENFORCE === "1";

// Everything the site loads is served from its own origin (KaTeX CSS and fonts are bundled).
// Inline scripts come from Next.js and the theme initialiser; inline styles from KaTeX.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only meaningful in an enforced policy; browsers warn about it in report-only mode.
  ...(https && enforce ? ["upgrade-insecure-requests"] : []),
  "report-uri /api/csp-report",
].join("; ");

const cspHeader = enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 dev writes AGENTS.md / CLAUDE.md into the repo root by default; this repo does not keep them.
  agentRules: false,
  serverExternalPackages: ["pg", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Dev mode needs eval for hot reload, so the policy only applies to production builds.
          ...(production ? [{ key: cspHeader, value: csp }] : []),
          // HSTS only when the site is really served over HTTPS; browsers ignore it over plain HTTP.
          ...(production && https ? [{ key: "Strict-Transport-Security", value: "max-age=15552000" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
