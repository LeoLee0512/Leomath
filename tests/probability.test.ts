import { describe, expect, it } from "vitest";
import { birthdayBound, birthdayExact, pairs, sameAsMine, sampleBirthdays, sharedDays, smallestGroup } from "@/lib/math/probability";

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
    const rng = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const trials = 20000;
    let hits = 0;
    for (let i = 0; i < trials; i++) if (sharedDays(sampleBirthdays(23, rng)).size > 0) hits++;
    expect(Math.abs(hits / trials - birthdayExact(23))).toBeLessThan(0.02);
  });
});
