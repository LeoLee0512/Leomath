import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import { remarkDisplayMathLines, rehypeLeoMath } from "./src/lib/mdx-plugins.ts";

const site = new URL(process.env.SITE_URL ?? "https://leomath.cn");

export default defineConfig({
  site: site.origin,
  security: {
    // Form posts must come from this site (CSRF). Behind nginx the app is reached over plain HTTP, so the
    // proxy's X-Forwarded-Proto/Host are trusted for the site's own domain only; without this every form
    // post from https://leomath.cn would be rejected as cross-origin.
    checkOrigin: true,
    allowedDomains: [{ hostname: site.hostname, protocol: site.protocol.replace(":", "") }],
  },
  // Pages show per-user progress, so they are rendered on each request by the Node server.
  output: "server",
  adapter: node({ mode: "standalone" }),
  server: { port: 3000 },
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  // Concept articles: GFM + remark-math, formulas rendered to MathML at compile time, no SmartyPants.
  markdown: {
    processor: unified({ gfm: true, smartypants: false, remarkPlugins: [remarkMath, remarkDisplayMathLines], rehypePlugins: [rehypeLeoMath] }),
  },
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: { external: ["pg", "bcryptjs"] },
  },
});
