import { describe, expect, it } from "vitest";
import { birthdayBound, birthdayExact, conditionals, intersectionRange, pairs, posterior, sameAsMine, sampleBirthdays, screeningCounts, sharedDays, smallestGroup } from "@/lib/math/probability";

describe("birthday problem", () => {
  it("matches the known exact values", () => {
    expect(birthdayExact(1)).toBe(0);
    expect(birthdayExact(2)).toBeCloseTo(1 / 365, 12);
    expect(birthdayExact(23)).toBeCloseTo(0.507297, 5);
    expect(birthdayExact(30)).toBeCloseTo(0.706316, 5);
    expect(birthdayExact(366)).toBe(1);
  });
  it("23 is the smallest group above one half", () => {
    expect(smallestGroup(0.5)).toBe(23);
    expect(birthdayExact(22)).toBeLessThan(0.5);
  });
  it("the exponential bound lies below the exact value and already passes 1/2 at 23", () => {
    for (let n = 1; n <= 100; n++) expect(birthdayBound(n)).toBeLessThanOrEqual(birthdayExact(n) + 1e-15);
    expect(birthdayBound(23)).toBeGreaterThan(0.5);
    expect(birthdayBound(22)).toBeLessThan(0.5);
  });
  it("sharing with one fixed person is much rarer", () => {
    expect(sameAsMine(23)).toBeCloseTo(1 - (364 / 365) ** 22, 12);
    expect(sameAsMine(23)).toBeLessThan(0.06);
    expect(pairs(23)).toBe(253);
  });
  it("simulation agrees with the formula", () => {
    let s = 12345;
    // 32-bit LCG; Math.imul keeps the product exact (s * 1103515245 would overflow 2^53).
    const rng = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
    const trials = 20000;
    let hits = 0;
    for (let i = 0; i < trials; i++) if (sharedDays(sampleBirthdays(23, rng)).size > 0) hits++;
    expect(Math.abs(hits / trials - birthdayExact(23))).toBeLessThan(0.02);
  });
});

describe("conditional probability and Bayes", () => {
  it("screening posterior matches the article's numbers", () => {
    const p1 = posterior(0.01, 0.95, 0.08);
    expect(p1).toBeCloseTo(0.0095 / (0.0095 + 0.0792), 12);
    expect(p1).toBeGreaterThan(0.1);
    expect(p1).toBeLessThan(0.11);
    const p2 = posterior(p1, 0.95, 0.08);
    expect(p2).toBeCloseTo(0.5875, 3);
  });
  it("a perfect test and a useless test behave as expected", () => {
    expect(posterior(0.3, 1, 0)).toBe(1);
    expect(posterior(0.3, 0.6, 0.6)).toBeCloseTo(0.3, 12);
  });
  it("expected counts add up", () => {
    const c = screeningCounts(1000, 0.01, 0.95, 0.08);
    expect(c.sick + c.healthy).toBe(1000);
    expect(c.tp + c.fn).toBe(c.sick);
    expect(c.fp + c.tn).toBe(c.healthy);
    expect(c).toMatchObject({ sick: 10, tp: 10, fp: 79 });
  });
  it("independence means B has the same share inside A and outside A", () => {
    const c = conditionals(0.5, 0.4, 0.2);
    expect(c.bGivenA).toBeCloseTo(0.4, 12);
    expect(c.bGivenNotA).toBeCloseTo(0.4, 12);
    expect(c.dependence).toBeCloseTo(0, 12);
    expect(c.aGivenB).toBeCloseTo(0.5, 12);
    expect(c.union).toBeCloseTo(0.7, 12);
    expect(conditionals(0.3, 0.4, 0).dependence).toBeLessThan(0);
  });
  it("Fréchet bounds", () => {
    expect(intersectionRange(0.7, 0.6)[0]).toBeCloseTo(0.3, 12);
    expect(intersectionRange(0.7, 0.6)[1]).toBeCloseTo(0.6, 12);
    expect(intersectionRange(0.2, 0.3)).toEqual([0, 0.2]);
  });
});
