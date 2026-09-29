import { describe, expect, it } from "vitest";
import { concepts, getConcept, getPath, nextInPath, paths, prerequisiteChain, prerequisiteClosure, experiments } from "@/content/graph";
import { exercises, checkAnswer, parseNumeric } from "@/content/exercises";

describe("knowledge graph integrity", () => {
  it("every prerequisite and parent exists", () => {
    for (const c of concepts) {
      for (const p of c.prerequisites) expect(getConcept(p), `${c.slug} → ${p}`).toBeDefined();
      if (c.parent) expect(getConcept(c.parent)).toBeDefined();
      for (const e of c.experiments) expect(experiments.find((x) => x.slug === e), `${c.slug} → ${e}`).toBeDefined();
    }
  });
  it("has no prerequisite cycles", () => {
    for (const c of concepts) expect(prerequisiteClosure(c.slug)).not.toContain(c.slug);
  });
  it("paths reference published concepts in order", () => {
    for (const p of paths) {
      for (const s of p.concepts) expect(getConcept(s)?.status).toBe("published");
    }
  });
  it("prerequisite chain is topologically ordered and ends at the target", () => {
    const chain = prerequisiteChain("pde");
    expect(chain.at(-1)).toBe("pde");
    const index = new Map(chain.map((s, i) => [s, i]));
    for (const s of chain) for (const p of getConcept(s)!.prerequisites) expect(index.get(p)!).toBeLessThan(index.get(s)!);
    expect(chain).toContain("limit");
    expect(chain).toContain("derivative");
  });
  it("every published concept has exercises with valid answers", () => {
    for (const c of concepts.filter((x) => x.status === "published")) {
      expect(exercises.filter((e) => e.concept === c.slug).length).toBeGreaterThan(0);
    }
    for (const e of exercises) {
      expect(getConcept(e.concept)).toBeDefined();
      if (e.kind === "choice") expect(e.correct).toBeLessThan(e.options.length);
    }
  });
  it("checks numeric answers including fractions", () => {
    const e = exercises.find((x) => x.id === "integral-1")!;
    expect(checkAnswer(e, "1/3")).toBe(true);
    expect(checkAnswer(e, "0.3333")).toBe(true);
    expect(checkAnswer(e, "0.5")).toBe(false);
    expect(parseNumeric("-1/6")).toBeCloseTo(-1 / 6);
    expect(parseNumeric("abc")).toBeNull();
  });
  it("every path describes who it is for and what it gives", () => {
    for (const p of paths) {
      for (const field of [p.requires, p.audience, p.outcome]) {
        expect(field.zh.length, p.slug).toBeGreaterThan(0);
        expect(field.en.length, p.slug).toBeGreaterThan(0);
      }
    }
  });
  it("the next step is the first concept not yet done", () => {
    const p = getPath("calculus")!;
    expect(nextInPath(p, {})).toMatchObject({ index: 0, done: 0 });
    expect(nextInPath(p, { limit: "done", derivative: "learning" })).toMatchObject({ index: 1, done: 1 });
    // Skipping ahead does not hide an unfinished earlier concept.
    expect(nextInPath(p, { derivative: "done" }).index).toBe(0);
    const all = Object.fromEntries(p.concepts.map((c) => [c, "done"]));
    expect(nextInPath(p, all).done).toBe(p.concepts.length);
  });
});
