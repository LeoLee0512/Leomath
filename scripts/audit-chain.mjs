// Depth-over-breadth audit: for every published concept, which links of the chain
// problem → observe → definition → derivation/proof → experiment → exercises → tool exist?
import { readFile } from "node:fs/promises";
import path from "node:path";

const graph = await readFile("src/content/graph.ts", "utf8");
const exercises = await readFile("src/content/exercises.ts", "utf8");
const slugs = [...graph.matchAll(/\{ slug: "([a-z0-9-]+)"[^\n]*status: "published"/g)].map((m) => m[1]);
const rows = [];
for (const slug of slugs) {
  const zh = await readFile(path.join("content/concepts", slug, "zh.mdx"), "utf8").catch(() => "");
  const en = await readFile(path.join("content/concepts", slug, "en.mdx"), "utf8").catch(() => null);
  const line = graph.split("\n").find((l) => l.includes(`slug: "${slug}"`)) ?? "";
  const has = (tag) => zh.includes(`<${tag}`);
  rows.push({
    slug,
    problem: has("Problem"), observe: has("Observe"), conjecture: has("Conjecture"),
    definition: has("Definition"), theorem: has("Theorem") || has("Proposition"), proof: has("Proof"),
    warning: has("Warning"), application: has("Application"),
    experiment: !/experiments: \[\]/.test(line),
    exercises: (exercises.match(new RegExp(`concept: "${slug}"`, "g")) ?? []).length,
    tool: /tools: \[/.test(line),
    en: en !== null,
  });
}
const cols = ["problem", "observe", "conjecture", "definition", "theorem", "proof", "warning", "application", "experiment", "tool", "en"];
console.log(["concept".padEnd(26), ...cols.map((c) => c.slice(0, 7).padEnd(8)), "exercises"].join(""));
for (const r of rows) {
  console.log([r.slug.padEnd(26), ...cols.map((c) => (r[c] ? "●" : "○").padEnd(8)), String(r.exercises)].join(""));
}
const gaps = rows.flatMap((r) => cols.filter((c) => !r[c]).map((c) => `${r.slug}: ${c}`)).concat(rows.filter((r) => r.exercises < 2).map((r) => `${r.slug}: exercises < 2`));
console.log(`\n${rows.length} published concepts, ${gaps.length} gaps` + (gaps.length ? ":\n  " + gaps.join("\n  ") : ""));
