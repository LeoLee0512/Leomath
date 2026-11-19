import { describe, expect, it } from "vitest";
import { distributions, histogram, moments, mulberry32, normalPdf, sampleMeans, standardize } from "@/lib/math/clt";

describe("central limit theorem sampling", () => {
  it("uses the correct means and standard deviations of the source distributions", () => {
    expect(distributions.bernoulli.mean).toBeCloseTo(0.1, 12);
    expect(distributions.bernoulli.sd).toBeCloseTo(0.3, 12);
    expect(distributions.uniform.mean).toBeCloseTo(0.5, 12);
    expect(distributions.uniform.sd).toBeCloseTo(Math.sqrt(1 / 12), 12);
    expect(distributions.exponential.mean).toBe(1);
    expect(distributions.exponential.sd).toBe(1);
  });

  it("is reproducible for the same seed and different for another seed", () => {
    const a = sampleMeans("uniform", 5, 20, 42);
    const b = sampleMeans("uniform", 5, 20, 42);
    const c = sampleMeans("uniform", 5, 20, 43);
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      expect(rng()).toBeGreaterThanOrEqual(0);
      expect(rng()).toBeLessThan(1);
    }
  });

  it("has the theoretical sample-mean centre and spread", () => {
    const means = sampleMeans("bernoulli", 100, 5000, 7);
    const m = moments(means);
    expect(m.mean).toBeCloseTo(0.1, 1);
    expect(m.sd).toBeCloseTo(0.03, 2);
    const z = standardize(means, 0.1, 0.03);
    const zm = moments(z);
    expect(zm.mean).toBeCloseTo(0, 1);
    expect(zm.sd).toBeCloseTo(1, 1);
  });

  it("normalises histogram areas and evaluates the normal density", () => {
    const values = new Float64Array([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
    const h = histogram(values, 0, 4, 4);
    expect(h.reduce((sum, density) => sum + density * 1, 0)).toBeCloseTo(1, 12);
    expect(h).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(normalPdf(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 12);
    expect(normalPdf(1)).toBeCloseTo(Math.exp(-0.5) / Math.sqrt(2 * Math.PI), 12);
  });
});
