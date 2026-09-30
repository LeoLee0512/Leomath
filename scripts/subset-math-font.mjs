// Cuts STIX Two Math (from @fontsource/stix-two-math, ~400 KB) down to the characters LeoMath's formulas use
// (~35 KB), keeping its MATH table so the browser can still stretch brackets and set fractions.
//   node scripts/subset-math-font.mjs
// Needs Python with fonttools and brotli: pip install fonttools brotli
// Run it after adding content with new symbols; tests/math-font.test.ts fails until the subset covers them.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { baseChars, formulaChars } from "./math-chars.mjs";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "node_modules/@fontsource/stix-two-math/files/stix-two-math-latin-400-normal.woff2");
const out = path.join(root, "src/styles/fonts/stix-two-math-leomath.woff2");
const list = path.join(root, "src/styles/fonts/stix-two-math-leomath.txt");

const chars = [...new Set([...baseChars(), ...formulaChars()])].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
writeFileSync(list, chars.join("") + "\n");
execFileSync("python", ["-m", "fontTools.subset", source, `--text-file=${list}`, "--layout-features=*", "--flavor=woff2", `--output-file=${out}`], { stdio: "inherit" });
console.log(`math font: ${chars.length} characters → ${path.relative(root, out)}`);
