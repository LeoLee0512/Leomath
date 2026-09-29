// Writes src/content/updated.json: the last commit date of each concept's articles, from git history.
// Runs before every build (npm "prebuild"). Where git history is unavailable (the Docker build
// context excludes .git) it leaves the committed file as it is.
import { execFileSync } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("content/concepts");
const out = path.resolve("src/content/updated.json");

function lastCommit(dir) {
  return execFileSync("git", ["log", "-1", "--format=%cs", "--", dir], { encoding: "utf8" }).trim();
}

try {
  execFileSync("git", ["rev-parse", "--git-dir"], { stdio: "ignore" });
} catch {
  console.log("content-dates: no git history here, keeping src/content/updated.json");
  process.exit(0);
}

const dates = {};
for (const slug of (await readdir(root)).sort()) {
  // Uncommitted new articles have no date yet; they get one on their first commit.
  const d = lastCommit(path.join(root, slug));
  if (d) dates[slug] = d;
}
await writeFile(out, JSON.stringify(dates, null, 2) + "\n");
console.log(`content-dates: ${Object.keys(dates).length} concepts`);
