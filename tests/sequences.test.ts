import { describe, expect, it } from "vitest";
import { lastOutside, sequences } from "@/lib/math/sequences";

describe("the N in the definition of a limit", () => {
  it("n/(n+1): the last term outside the ε-band is ⌊1/ε⌋ − 1", () => {
    const { term } = sequences.ratio;
    for (const eps of [0.5, 0.1, 0.05, 0.013]) expect(lastOutside(term, 1, eps, 10000)).toBe(Math.floor(1 / eps) - 1);
  });
  it("a smaller ε needs a larger N", () => {
    for (const s of [sequences.ratio, sequences.alternating, sequences.sine]) {
      expect(lastOutside(s.term, 1, 0.02, 100000)).toBeGreaterThanOrEqual(lastOutside(s.term, 1, 0.1, 100000));
    }
  });
  it("sin(n)/√n: N can be as large as about 1/ε²", () => {
    const N = lastOutside(sequences.sine.term, 1, 0.05, 100000);
    expect(N).toBeLessThanOrEqual(400);
    expect(N).toBeGreaterThan(100);
  });
  it("(−1)ⁿ has no limit: for ε ≤ 1 terms leave every band to the end", () => {
    for (const L of [-1, 0, 0.5, 1]) expect(lastOutside(sequences.sign.term, L, 0.9, 1000)).toBeGreaterThanOrEqual(999);
    // A wrong candidate fails too.
    expect(lastOutside(sequences.ratio.term, 0.95, 0.01, 1000)).toBe(1000);
  });
});
