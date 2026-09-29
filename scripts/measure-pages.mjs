// Measures what a first visit to a page costs: HTML size (raw and gzip), the share of that HTML that is
// React's hydration payload, server time (median of several requests), and the JavaScript the page loads.
//   npm run build && npx next start -p 3100   (in another terminal)
//   node scripts/measure-pages.mjs [baseUrl]
import { gzipSync } from "node:zlib";

const base = process.argv[2] ?? "http://localhost:3100";
const pages = ["/zh", "/zh/learn", "/zh/concepts/derivative", "/zh/concepts/second-order-linear-ode", "/zh/concepts/conditional-probability", "/zh/problems", "/zh/explore/linear-transform"];
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const jsCache = new Map();

async function jsBytes(src) {
  if (!jsCache.has(src)) {
    const body = Buffer.from(await (await fetch(new URL(src, base))).arrayBuffer());
    jsCache.set(src, { raw: body.length, gz: gzipSync(body).length });
  }
  return jsCache.get(src);
}

console.log("page".padEnd(40), "html".padStart(8), "html.gz".padStart(9), "rsc%".padStart(6), "server".padStart(8), "js.gz".padStart(8));
for (const p of pages) {
  const times = [];
  let html = "";
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    html = await (await fetch(base + p)).text();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const rsc = [...html.matchAll(/<script[^>]*>self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g)].reduce((s, m) => s + m[1].length, 0);
  const scripts = [...new Set([...html.matchAll(/<script[^>]*src="([^"]+\.js)"/g)].map((m) => m[1]))];
  let js = 0;
  for (const s of scripts) js += (await jsBytes(s)).gz;
  const gz = gzipSync(Buffer.from(html)).length;
  console.log(p.padEnd(40), kb(html.length).padStart(8), kb(gz).padStart(9), `${Math.round((100 * rsc) / html.length)}%`.padStart(6), `${times[2].toFixed(0)}ms`.padStart(8), kb(js).padStart(8));
}
