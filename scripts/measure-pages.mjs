// Measures what a first visit to a page costs: HTML size (raw and gzip), server time (median of five requests),
// and the JavaScript the page loads once every island has hydrated (scripts, island components and their imports).
//   npm run build && PORT=3100 node dist/server/entry.mjs   (in another terminal)
//   node scripts/measure-pages.mjs [baseUrl] [/path,/path,…]
import { gzipSync } from "node:zlib";

const base = process.argv[2] ?? "http://localhost:3100";
const pages = process.argv[3]?.split(",") ?? ["/zh", "/zh/learn", "/zh/concepts/derivative", "/zh/concepts/random-variables", "/zh/problems", "/zh/explore/linear-transform", "/zh/tools", "/zh/about"];
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const modules = new Map();

/** A JS module and everything it imports, fetched once and remembered. */
async function moduleGraph(url, seen = new Set()) {
  if (seen.has(url)) return seen;
  seen.add(url);
  if (!modules.has(url)) modules.set(url, await (await fetch(url)).text());
  for (const m of modules.get(url).matchAll(/(?:import|export)\s*(?:[^"'();]*?from\s*)?["']([^"']+\.js)["']|import\(\s*["']([^"']+\.js)["']\s*\)/g)) {
    await moduleGraph(new URL(m[1] ?? m[2], url).href, seen);
  }
  return seen;
}

console.log("page".padEnd(36), "html".padStart(8), "html.gz".padStart(9), "server".padStart(8), "js.gz".padStart(8));
for (const p of pages) {
  const times = [];
  let html = "";
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    html = await (await fetch(base + p)).text();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const entries = new Set([
    ...[...html.matchAll(/<script[^>]*\ssrc="([^"]+\.js)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/(?:component-url|renderer-url)="([^"]+)"/g)].map((m) => m[1]),
  ]);
  const seen = new Set();
  for (const e of entries) await moduleGraph(new URL(e, base).href, seen);
  let js = 0;
  for (const u of seen) js += gzipSync(modules.get(u)).length;
  console.log(p.padEnd(36), kb(html.length).padStart(8), kb(gzipSync(Buffer.from(html)).length).padStart(9), `${times[2].toFixed(0)}ms`.padStart(8), kb(js).padStart(8));
}
