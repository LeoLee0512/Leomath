export type DistributionId = "bernoulli" | "uniform" | "exponential";

export interface Distribution {
  mean: number;
  sd: number;
  sample: (rng: () => number, p?: number) => number;
}

export const distributions: Record<DistributionId, Distribution> = {
  bernoulli: {
    mean: 0.1,
    sd: 0.3,
    sample: (rng, p = 0.1) => (rng() < p ? 1 : 0),
  },
  uniform: {
    mean: 0.5,
    sd: Math.sqrt(1 / 12),
    sample: (rng) => rng(),
  },
  exponential: {
    mean: 1,
    sd: 1,
    sample: (rng) => -Math.log(1 - rng()),
  },
};

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleMeans(id: DistributionId, n: number, count: number, seed = 1, p = 0.1): Float64Array {
  const distribution = distributions[id];
  const rng = mulberry32(seed);
  const means = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += distribution.sample(rng, p);
    means[i] = sum / n;
  }
  return means;
}

export function standardize(values: Float64Array, mean: number, sd: number): Float64Array {
  return values.map((x) => (x - mean) / sd);
}

export function moments(values: Float64Array): { mean: number; sd: number } {
  const mean = values.reduce((sum, x) => sum + x, 0) / values.length;
  const variance = values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length;
  return { mean, sd: Math.sqrt(variance) };
}

export function histogram(values: Float64Array, lo: number, hi: number, bins: number): number[] {
  const counts = new Array<number>(bins).fill(0);
  const width = (hi - lo) / bins;
  for (const x of values) {
    if (x < lo || x >= hi) continue;
    const index = Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / width)));
    counts[index]++;
  }
  return counts.map((count) => count / values.length / width);
}

export function normalPdf(x: number, mean = 0, sd = 1): number {
  return Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
}
