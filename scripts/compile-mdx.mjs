// Checks the content before a build: every MDX article compiles, and every formula on the site
// (articles, exercises, experiments, pages) parses in Temml without an error.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import temml from "temml";
import { formulas } from "./math-chars.mjs";

const root = path.resolve("content/concepts");
let failed = 0;
let count = 0;
for (const slug of await readdir(root)) {
  for (const file of await readdir(path.join(root, slug))) {
    if (!file.endsWith(".mdx")) continue;
    count++;
    try {
      await compile(await readFile(path.join(root, slug, file), "utf8"), { remarkPlugins: [remarkGfm, remarkMath] });
    } catch (err) {
      failed++;
      console.error(`✗ ${slug}/${file}: ${err.message}`);
    }
  }
}

let bad = 0;
const all = formulas();
for (const { tex, display } of all) {
  try {
    temml.renderToString(tex, { displayMode: display, throwOnError: true });
  } catch (err) {
    bad++;
    console.error(`✗ formula ${JSON.stringify(tex.slice(0, 80))}: ${err.message.split("\n")[0]}`);
  }
}
console.log(`${count} files, ${failed} failed; ${all.length} formulas, ${bad} failed`);
process.exit(failed || bad ? 1 : 0);
