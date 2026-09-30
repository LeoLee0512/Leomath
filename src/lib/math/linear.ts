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
  // Fix the sign so the first nonzero component is positive; eigenvectors are only defined up to scale.
  const sign = v[0] < -1e-12 || (Math.abs(v[0]) <= 1e-12 && v[1] < 0) ? -1 : 1;
  return [(sign * v[0]) / n, (sign * v[1]) / n];
}

export function format(x: number, digits = 2): string {
  const r = Number(x.toFixed(digits));
  return Object.is(r, -0) ? "0" : r.toString();
}

/**
 * Coordinates (c₁, c₂) of v in the basis b₁, b₂, i.e. v = c₁b₁ + c₂b₂ (Cramer's rule),
 * or null when b₁, b₂ are (numerically) collinear and so not a basis.
 */
export function coordinates(b1: Vec2, b2: Vec2, v: Vec2): Vec2 | null {
  const d = b1[0] * b2[1] - b2[0] * b1[1];
  const scale = Math.hypot(b1[0], b1[1]) * Math.hypot(b2[0], b2[1]);
  if (scale === 0 || Math.abs(d) < 1e-9 * Math.max(1, scale)) return null;
  return [(v[0] * b2[1] - b2[0] * v[1]) / d, (b1[0] * v[1] - v[0] * b1[1]) / d];
}

/** The inner product uᵀGv for a symmetric positive definite G = [[a, b], [b, d]] given as a Mat2. */
export function inner(g: Mat2, u: Vec2, v: Vec2): number {
  return u[0] * (g[0] * v[0] + g[1] * v[1]) + u[1] * (g[2] * v[0] + g[3] * v[1]);
}

/**
 * Projection of u onto the line of v in the inner product G: coefficient t = ⟨u,v⟩/⟨v,v⟩,
 * the projection tv, the remainder u − tv (orthogonal to v in G), and the Cauchy–Schwarz slack
 * ⟨u,u⟩⟨v,v⟩ − ⟨u,v⟩², which equals ⟨v,v⟩·⟨u−tv, u−tv⟩.
 */
export function projection(g: Mat2, u: Vec2, v: Vec2) {
  const uv = inner(g, u, v);
  const uu = inner(g, u, u);
  const vv = inner(g, v, v);
  const t = vv > 0 ? uv / vv : 0;
  const p: Vec2 = [t * v[0], t * v[1]];
  const r: Vec2 = [u[0] - p[0], u[1] - p[1]];
  return { uv, uu, vv, t, p, r, slack: uu * vv - uv * uv };
}
