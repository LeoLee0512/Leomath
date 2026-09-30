// Every character LeoMath's formulas put on screen, as Temml renders them. Used by scripts/subset-math-font.mjs
// (to cut the math font down to what is needed) and by tests/math-font.test.ts (to check the font still covers it).
//
// Formulas are found in the articles ($…$, $$…$$) and in the source: any string literal holding $…$, and any
// string literal with a TeX command (a backslash) in the files that pass formulas to tex() directly.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import temml from "temml";

const root = path.resolve(import.meta.dirname, "..");

function files(dir, ext) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p, ext));
    else if (ext.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const dollars = (text) => [...text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)].map((m) => ({ tex: m[1] ?? m[2], display: m[1] !== undefined }));

/** String literals in JS/TS/Astro source, with escapes resolved. */
function literals(code) {
  const out = [];
  for (const m of code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)) {
    const raw = m[1] ?? m[2] ?? m[3];
    // Template literals with interpolations are markup or URLs, not formulas.
    if (m[3] !== undefined && m[3].includes("${")) continue;
    out.push(raw.replace(/\\(.)/gs, (_, c) => ({ n: "\n", t: "\t" })[c] ?? c));
  }
  return out;
}

/** Files whose string literals include bare TeX handed to tex() (experiment formulas, page decorations). */
const BARE_TEX = /experiment-tex\.ts$|pages[\\/].*\.astro$|components[\\/].*\.astro$/;

export function formulas() {
  const list = [];
  for (const f of files(path.join(root, "content"), [".mdx"])) list.push(...dollars(readFileSync(f, "utf8")));
  for (const f of files(path.join(root, "src"), [".ts", ".tsx", ".astro"])) {
    const code = readFileSync(f, "utf8");
    for (const s of literals(code)) {
      if (s.includes("$")) list.push(...dollars(s));
      else if (BARE_TEX.test(f) && /\\[a-zA-Z|{}]/.test(s)) list.push({ tex: s, display: false });
    }
  }
  return list;
}

const ENTITIES = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

export function formulaChars() {
  const chars = new Set();
  for (const { tex, display } of formulas()) {
    const html = temml.renderToString(tex, { displayMode: display, throwOnError: false });
    const text = html
      .replace(/<annotation[\s\S]*?<\/annotation>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, e) =>
        e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e] ?? ""),
      );
    // Chinese text inside \text{…} is set in the page's own CJK font, not the math font.
    for (const c of text) if (!/\s|\p{Script=Han}|[　-〿＀-￯]/u.test(c)) chars.add(c);
  }
  return chars;
}

/** Always kept, so that new content rarely needs a new subset: ASCII, Greek, and the math italic alphabet. */
export function baseChars() {
  const chars = new Set();
  const range = (a, b) => { for (let c = a; c <= b; c++) chars.add(String.fromCodePoint(c)); };
  range(0x21, 0x7e);
  range(0x391, 0x3a9);
  range(0x3b1, 0x3c9);
  range(0x1d434, 0x1d467);
  range(0x1d6fc, 0x1d71b);
  return chars;
}
