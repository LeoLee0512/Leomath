/** 2×2 real matrices as [a, b, c, d] meaning [[a, b], [c, d]]. Columns are the images of e1 and e2. */
export type Mat2 = readonly [number, number, number, number];
export type Vec2 = readonly [number, number];

export const IDENTITY: Mat2 = [1, 0, 0, 1];

export function fromColumns(e1: Vec2, e2: Vec2): Mat2 {
  return [e1[0], e2[0], e1[1], e2[1]];
}

export function columns(m: Mat2): [Vec2, Vec2] {
  return [
    [m[0], m[2]],
    [m[1], m[3]],
  ];
}

export function apply(m: Mat2, v: Vec2): Vec2 {
  return [m[0] * v[0] + m[1] * v[1], m[2] * v[0] + m[3] * v[1]];
}

export function multiply(a: Mat2, b: Mat2): Mat2 {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];
}

export function det(m: Mat2): number {
  return m[0] * m[3] - m[1] * m[2];
}

export function trace(m: Mat2): number {
  return m[0] + m[3];
}

export interface Eigen2 {
  /** Real eigenvalues, or undefined when the eigenvalues are complex. */
  values?: [number, number];
  /** Unit eigenvectors matching `values`. */
  vectors?: [Vec2, Vec2];
  complex: boolean;
  /** Real and imaginary parts when complex. */
  re?: number;
  im?: number;
}

/**
 * Eigen-decomposition of a real 2×2 matrix.
 * Characteristic polynomial: λ² − (tr M) λ + det M = 0.
 */
export function eigen(m: Mat2): Eigen2 {
  const t = trace(m);
  const d = det(m);
  const disc = t * t - 4 * d;
  if (disc < -1e-12) {
    return { complex: true, re: t / 2, im: Math.sqrt(-disc) / 2 };
  }
  const s = Math.sqrt(Math.max(disc, 0));
  const l1 = (t + s) / 2;
  const l2 = (t - s) / 2;
  return {
    complex: false,
    values: [l1, l2],
    vectors: [eigenvector(m, l1), eigenvector(m, l2)],
  };
}

function eigenvector(m: Mat2, lambda: number): Vec2 {
  const [a, b, c, d] = m;
  // Solve (M − λI)v = 0. Rows of M − λI: [a−λ, b], [c, d−λ]. Take the row with larger norm.
  const r1: Vec2 = [a - lambda, b];
  const r2: Vec2 = [c, d - lambda];
  const n1 = Math.hypot(r1[0], r1[1]);
  const n2 = Math.hypot(r2[0], r2[1]);
  let v: Vec2;
  if (n1 < 1e-12 && n2 < 1e-12) {
    v = [1, 0]; // M = λI: every vector is an eigenvector
  } else {
    const r = n1 >= n2 ? r1 : r2;
    v = [-r[1], r[0]]; // perpendicular to the row
  }
  const n = Math.hypot(v[0], v[1]);
  return [v[0] / n, v[1] / n];
}

export function format(x: number, digits = 2): string {
  const r = Number(x.toFixed(digits));
  return Object.is(r, -0) ? "0" : r.toString();
}
