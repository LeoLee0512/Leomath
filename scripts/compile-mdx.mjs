// Compiles every MDX article to catch syntax errors before build.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const root = path.resolve("content/concepts");
let failed = 0;
let count = 0;
for (const slug of await readdir(root)) {
  for (const file of await readdir(path.join(root, slug))) {
    if (!file.endsWith(".mdx")) continue;
    count++;
    const src = await readFile(path.join(root, slug, file), "utf8");
    try {
      const out = String(await compile(src, {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [[rehypeKatex, { strict: "error", throwOnError: true }]],
      }));
      const bad = out.match(/katex-error[^"]*"[^"]*title:\s*"([^"]{0,120})/);
      if (out.includes("katex-error")) throw new Error(`KaTeX error: ${bad ? bad[1] : "see rendered page"}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${slug}/${file}: ${err.message}`);
    }
  }
}
console.log(`${count} files, ${failed} failed`);
process.exit(failed ? 1 : 0);
