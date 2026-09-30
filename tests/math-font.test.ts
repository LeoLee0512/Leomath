import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
// @ts-expect-error: plain ES module shared with scripts/subset-math-font.mjs
import { formulaChars } from "../scripts/math-chars.mjs";

describe("the math font subset", () => {
  it("covers every character LeoMath's formulas put on screen (else run npm run font:subset)", () => {
    const covered = new Set(readFileSync(path.resolve("src/styles/fonts/stix-two-math-leomath.txt"), "utf8").trim());
    const missing = [...(formulaChars() as Set<string>)].filter((c) => !covered.has(c));
    expect(missing).toEqual([]);
  });
});
