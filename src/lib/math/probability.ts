/** Classical probability helpers: the birthday problem, Bayes, and the binomial and Poisson laws. */

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
  if (!(p <= 1)) throw new RangeError("p must be at most 1");
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

/** P(X = k) for X ~ B(n, p), k = 0 … n. Computed in logs, so n in the thousands is fine. */
export function binomialPmf(n: number, p: number): number[] {
  const out = new Array<number>(n + 1).fill(0);
  if (p <= 0) {
    out[0] = 1;
    return out;
  }
  if (p >= 1) {
    out[n] = 1;
    return out;
  }
  const lp = Math.log(p);
  const lq = Math.log1p(-p);
  // ln C(n, k) built up term by term: C(n, k+1) = C(n, k)·(n−k)/(k+1).
  let lc = 0;
  for (let k = 0; k <= n; k++) {
    out[k] = Math.exp(lc + k * lp + (n - k) * lq);
    lc += Math.log(n - k) - Math.log(k + 1);
  }
  return out;
}

/** P(Y = k) for Y ~ Poisson(λ), k = 0 … kMax, by π₀ = e^{−λ}, π_{k+1} = π_k·λ/(k+1). */
export function poissonPmf(lambda: number, kMax: number): number[] {
  const out = new Array<number>(kMax + 1);
  out[0] = Math.exp(-lambda);
  for (let k = 0; k < kMax; k++) out[k + 1] = (out[k] * lambda) / (k + 1);
  return out;
}

/**
 * The most likely values of B(n, p). The ratio P(k)/P(k−1) = (n−k+1)p / (k(1−p)) exceeds 1 exactly
 * when k < (n+1)p, so the peak is at ⌊(n+1)p⌋, shared with the value below when (n+1)p is a whole number.
 */
export function binomialMode(n: number, p: number): number[] {
  if (p <= 0) return [0];
  if (p >= 1) return [n];
  const m = (n + 1) * p;
  const r = Math.round(m);
  if (Math.abs(m - r) < 1e-9 && r >= 1 && r <= n) return [r - 1, r];
  return [Math.min(n, Math.floor(m))];
}

/**
 * Total variation distance ½·Σ|P(X=k) − P(Y=k)| between X ~ B(n, λ/n) and Y ~ Poisson(λ):
 * the largest amount by which the two laws can disagree on any event. Needs n ≥ λ.
 */
export function binomialPoissonDistance(n: number, lambda: number): number {
  const b = binomialPmf(n, lambda / n);
  const q = poissonPmf(lambda, n);
  let sum = 0;
  let poissonMass = 0;
  for (let k = 0; k <= n; k++) {
    sum += Math.abs(b[k] - q[k]);
    poissonMass += q[k];
  }
  // Beyond n the binomial is 0, so the Poisson tail counts in full.
  return (sum + Math.max(0, 1 - poissonMass)) / 2;
}

/** One outcome of n independent trials with success probability p. */
export function sampleTrials(n: number, p: number, rng: () => number = Math.random): boolean[] {
  return Array.from({ length: n }, () => rng() < p);
}
