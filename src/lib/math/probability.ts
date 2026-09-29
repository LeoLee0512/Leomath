/** Classical probability helpers: the birthday problem. */

/** P(at least two of n people share a birthday), with d equally likely days. Exact product form. */
export function birthdayExact(n: number, d = 365): number {
  if (n > d) return 1;
  let none = 1;
  for (let k = 1; k < n; k++) none *= (d - k) / d;
  return 1 - none;
}

/** The bound 1 − exp(−n(n−1)/(2d)) from 1 − x ≤ e^{−x}; always ≤ birthdayExact(n, d). */
export function birthdayBound(n: number, d = 365): number {
  return 1 - Math.exp(-(n * (n - 1)) / (2 * d));
}

/** P(someone among n − 1 others shares one fixed person's birthday). */
export function sameAsMine(n: number, d = 365): number {
  return 1 - Math.pow((d - 1) / d, Math.max(0, n - 1));
}

/** Number of unordered pairs among n people. */
export function pairs(n: number): number {
  return (n * (n - 1)) / 2;
}

/** Smallest n with birthdayExact(n, d) ≥ p. */
export function smallestGroup(p: number, d = 365): number {
  let n = 1;
  while (birthdayExact(n, d) < p) n++;
  return n;
}

/** n independent uniform birthdays in 0 … d−1. */
export function sampleBirthdays(n: number, rng: () => number = Math.random, d = 365): number[] {
  return Array.from({ length: n }, () => Math.floor(rng() * d));
}

/** Days that occur more than once in a sample. */
export function sharedDays(days: number[]): Set<number> {
  const seen = new Set<number>();
  const shared = new Set<number>();
  for (const x of days) {
    if (seen.has(x)) shared.add(x);
    seen.add(x);
  }
  return shared;
}

/** Bayes' rule for a yes/no cause: P(cause | positive) from the prior, P(+ | cause) and P(+ | no cause). */
export function posterior(prior: number, sensitivity: number, falsePositive: number): number {
  const pos = sensitivity * prior + falsePositive * (1 - prior);
  return pos === 0 ? 0 : (sensitivity * prior) / pos;
}

/** Expected counts in a population of n: true/false positives and negatives, rounded to whole people. */
export function screeningCounts(n: number, prior: number, sensitivity: number, falsePositive: number) {
  const sick = Math.round(n * prior);
  const tp = Math.round(sick * sensitivity);
  const fp = Math.round((n - sick) * falsePositive);
  return { sick, healthy: n - sick, tp, fn: sick - tp, fp, tn: n - sick - fp };
}

/**
 * The conditional structure of two events given P(A), P(B), P(A∩B):
 * the share of B inside A and inside Aᶜ, and the reverse conditional P(A | B).
 */
export function conditionals(pA: number, pB: number, pAB: number) {
  return {
    bGivenA: pA > 0 ? pAB / pA : 0,
    bGivenNotA: pA < 1 ? (pB - pAB) / (1 - pA) : 0,
    aGivenB: pB > 0 ? pAB / pB : 0,
    union: pA + pB - pAB,
    dependence: pAB - pA * pB,
  };
}

/** The admissible range of P(A∩B) for given P(A), P(B) (Fréchet bounds). */
export function intersectionRange(pA: number, pB: number): [number, number] {
  return [Math.max(0, pA + pB - 1), Math.min(pA, pB)];
}
