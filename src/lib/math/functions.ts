/** Preset functions shared by the calculus experiments, with exact derivatives, antiderivatives and Taylor data. */

export interface PresetFunction {
  id: string;
  label: string;
  tex: string;
  f: (x: number) => number;
  df: (x: number) => number;
  /** Antiderivative, when elementary. */
  F?: (x: number) => number;
  /** Domain restriction. */
  domain?: [number, number];
  /** k-th derivative at a, for Taylor experiments. */
  derivativeAt?: (k: number, a: number) => number;
  /** Radius of convergence about 0 (Infinity when entire). */
  radius?: number;
}

export const presetFunctions: PresetFunction[] = [
  {
    id: "exp", label: "eˣ", tex: "e^{x}",
    f: Math.exp, df: Math.exp, F: Math.exp,
    derivativeAt: (_k, a) => Math.exp(a), radius: Infinity,
  },
  {
    id: "sin", label: "sin x", tex: "\\sin x",
    f: Math.sin, df: Math.cos, F: (x) => -Math.cos(x),
    derivativeAt: (k, a) => Math.sin(a + (k * Math.PI) / 2), radius: Infinity,
  },
  {
    id: "cos", label: "cos x", tex: "\\cos x",
    f: Math.cos, df: (x) => -Math.sin(x), F: Math.sin,
    derivativeAt: (k, a) => Math.cos(a + (k * Math.PI) / 2), radius: Infinity,
  },
  {
    id: "square", label: "x²", tex: "x^{2}",
    f: (x) => x * x, df: (x) => 2 * x, F: (x) => (x * x * x) / 3,
    derivativeAt: (k, a) => (k === 0 ? a * a : k === 1 ? 2 * a : k === 2 ? 2 : 0), radius: Infinity,
  },
  {
    id: "cubic", label: "x³ − x", tex: "x^{3}-x",
    f: (x) => x * x * x - x, df: (x) => 3 * x * x - 1, F: (x) => (x ** 4) / 4 - (x * x) / 2,
    derivativeAt: (k, a) => (k === 0 ? a ** 3 - a : k === 1 ? 3 * a * a - 1 : k === 2 ? 6 * a : k === 3 ? 6 : 0), radius: Infinity,
  },
  {
    id: "ln", label: "ln x", tex: "\\ln x",
    f: Math.log, df: (x) => 1 / x, F: (x) => x * Math.log(x) - x, domain: [1e-6, Infinity],
    derivativeAt: (k, a) => (k === 0 ? Math.log(a) : ((k % 2 === 1 ? 1 : -1) * factorial(k - 1)) / Math.pow(a, k)),
  },
  {
    id: "ln1p", label: "ln(1 + x)", tex: "\\ln(1+x)",
    f: (x) => Math.log(1 + x), df: (x) => 1 / (1 + x), domain: [-1 + 1e-6, Infinity],
    derivativeAt: (k, a) => (k === 0 ? Math.log(1 + a) : ((k % 2 === 1 ? 1 : -1) * factorial(k - 1)) / Math.pow(1 + a, k)), radius: 1,
  },
  {
    id: "geom", label: "1 / (1 − x)", tex: "\\frac{1}{1-x}",
    f: (x) => 1 / (1 - x), df: (x) => 1 / ((1 - x) * (1 - x)),
    derivativeAt: (k, a) => factorial(k) / Math.pow(1 - a, k + 1), radius: 1,
  },
  {
    id: "lorentz", label: "1 / (1 + x²)", tex: "\\frac{1}{1+x^{2}}",
    f: (x) => 1 / (1 + x * x), df: (x) => (-2 * x) / ((1 + x * x) ** 2), F: Math.atan,
  },
];

export function getPreset(id: string): PresetFunction {
  return presetFunctions.find((p) => p.id === id) ?? presetFunctions[0];
}

export function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Taylor polynomial of order n about a, evaluated at x. */
export function taylor(p: PresetFunction, n: number, a: number, x: number): number {
  if (!p.derivativeAt) return NaN;
  let sum = 0;
  let pow = 1;
  for (let k = 0; k <= n; k++) {
    sum += (p.derivativeAt(k, a) / factorial(k)) * pow;
    pow *= x - a;
  }
  return sum;
}

