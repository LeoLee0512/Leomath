import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leomath.cn";
const production = process.env.NODE_ENV === "production";
const https = siteUrl.startsWith("https://");

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
          // Content-Security-Policy is set per request in src/proxy.ts, with a nonce.
          // HSTS only when the site is really served over HTTPS; browsers ignore it over plain HTTP.
          ...(production && https ? [{ key: "Strict-Transport-Security", value: "max-age=15552000" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
