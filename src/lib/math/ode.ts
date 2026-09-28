/** Numerical integration of first-order systems y' = f(t, y), y ∈ ℝⁿ. */
export type Field = (t: number, y: readonly number[]) => number[];

export type Method = "euler" | "midpoint" | "rk4";

export interface Trajectory {
  t: number[];
  y: number[][];
}

function axpy(y: readonly number[], h: number, k: readonly number[]): number[] {
  return y.map((yi, i) => yi + h * k[i]);
}

export function eulerStep(f: Field, t: number, y: readonly number[], h: number): number[] {
  return axpy(y, h, f(t, y));
}

export function midpointStep(f: Field, t: number, y: readonly number[], h: number): number[] {
  const k1 = f(t, y);
  const k2 = f(t + h / 2, axpy(y, h / 2, k1));
  return axpy(y, h, k2);
}

export function rk4Step(f: Field, t: number, y: readonly number[], h: number): number[] {
  const k1 = f(t, y);
  const k2 = f(t + h / 2, axpy(y, h / 2, k1));
  const k3 = f(t + h / 2, axpy(y, h / 2, k2));
  const k4 = f(t + h, axpy(y, h, k3));
  return y.map((yi, i) => yi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

const steppers = { euler: eulerStep, midpoint: midpointStep, rk4: rk4Step } as const;

export function integrate(
  f: Field,
  y0: readonly number[],
  t0: number,
  t1: number,
  h: number,
  method: Method,
): Trajectory {
  const step = steppers[method];
  const n = Math.max(1, Math.ceil((t1 - t0) / h - 1e-9));
  const t: number[] = [t0];
  const y: number[][] = [[...y0]];
  let cur = [...y0];
  let tc = t0;
  for (let i = 0; i < n; i++) {
    const hh = Math.min(h, t1 - tc);
    cur = step(f, tc, cur, hh);
    tc += hh;
    if (!cur.every(Number.isFinite) || cur.some((v) => Math.abs(v) > 1e6)) break;
    t.push(tc);
    y.push(cur);
  }
  return { t, y };
}

/** Preset equations used by the ODE explorer. Parameters are exposed as sliders. */
export interface OdePreset {
  id: string;
  dimension: 1 | 2;
  params: { key: string; label: string; min: number; max: number; step: number; value: number }[];
  field: (p: Record<string, number>) => Field;
  exact?: (p: Record<string, number>, y0: readonly number[]) => ((t: number) => number[]) | undefined;
  defaultY0: number[];
  tMax: number;
  bounds: { y: [number, number]; x?: [number, number] };
}

export const presets: OdePreset[] = [
  {
    id: "exponential",
    dimension: 1,
    params: [{ key: "k", label: "k", min: -2, max: 2, step: 0.05, value: 1 }],
    field: (p) => (_t, y) => [p.k * y[0]],
    exact: (p, y0) => (t) => [y0[0] * Math.exp(p.k * t)],
    defaultY0: [1],
    tMax: 3,
    bounds: { y: [-1, 8] },
  },
  {
    id: "logistic",
    dimension: 1,
    params: [
      { key: "r", label: "r", min: 0, max: 3, step: 0.05, value: 1.5 },
      { key: "K", label: "K", min: 0.5, max: 5, step: 0.1, value: 3 },
    ],
    field: (p) => (_t, y) => [p.r * y[0] * (1 - y[0] / p.K)],
    exact: (p, y0) => {
      if (y0[0] === 0) return () => [0];
      return (t) => [p.K / (1 + ((p.K - y0[0]) / y0[0]) * Math.exp(-p.r * t))];
    },
    defaultY0: [0.3],
    tMax: 8,
    bounds: { y: [-0.5, 5.5] },
  },
  {
    id: "harmonic",
    dimension: 2,
    params: [
      { key: "omega", label: "ω", min: 0.2, max: 3, step: 0.05, value: 1 },
      { key: "gamma", label: "γ", min: 0, max: 1.5, step: 0.05, value: 0 },
    ],
    field: (p) => (_t, y) => [y[1], -p.omega * p.omega * y[0] - 2 * p.gamma * y[1]],
    exact: (p, y0) => {
      const w = p.omega;
      const g = p.gamma;
      const disc = g * g - w * w;
      if (disc >= 0) return undefined; // over-/critically damped: handled numerically only
      const wd = Math.sqrt(-disc);
      const A = y0[0];
      const B = (y0[1] + g * y0[0]) / wd;
      return (t) => {
        const e = Math.exp(-g * t);
        const x = e * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
        const v = e * ((-g * A + wd * B) * Math.cos(wd * t) + (-g * B - wd * A) * Math.sin(wd * t));
        return [x, v];
      };
    },
    defaultY0: [1.5, 0],
    tMax: 12,
    bounds: { y: [-2.5, 2.5], x: [-2.5, 2.5] },
  },
  {
    id: "pendulum",
    dimension: 2,
    params: [
      { key: "g", label: "g/L", min: 0.5, max: 4, step: 0.1, value: 2 },
      { key: "gamma", label: "γ", min: 0, max: 1, step: 0.05, value: 0.1 },
    ],
    field: (p) => (_t, y) => [y[1], -p.g * Math.sin(y[0]) - p.gamma * y[1]],
    defaultY0: [2.4, 0],
    tMax: 15,
    bounds: { y: [-4, 4], x: [-4, 4] },
  },
];

export function getPreset(id: string): OdePreset {
  return presets.find((p) => p.id === id) ?? presets[0];
}
