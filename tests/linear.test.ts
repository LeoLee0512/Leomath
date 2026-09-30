import { describe, expect, it } from "vitest";
import { apply, coordinates, det, eigen, fromColumns, inner, multiply, projection, type Mat2 } from "@/lib/math/linear";

describe("2×2 linear algebra", () => {
  it("columns are the images of the basis vectors", () => {
    const m = fromColumns([2, 1], [0, 3]);
    expect(apply(m, [1, 0])).toEqual([2, 1]);
    expect(apply(m, [0, 1])).toEqual([0, 3]);
    expect(apply(m, [1, 2])).toEqual([2, 7]);
  });
  it("determinant and product", () => {
    const a: Mat2 = [2, 1, 3, 4];
    expect(det(a)).toBe(5);
    const r: Mat2 = [0, -1, 1, 0];
    expect(det(multiply(r, r))).toBeCloseTo(1);
    multiply(r, r).forEach((v, i) => expect(v).toBeCloseTo([-1, 0, 0, -1][i]));
  });
  it("eigen-decomposition of a symmetric matrix", () => {
    const e = eigen([2, 1, 1, 2]);
    expect(e.complex).toBe(false);
    expect(e.values).toEqual([3, 1]);
    const v = e.vectors![0];
    expect(Math.abs(v[0]) - Math.abs(v[1])).toBeCloseTo(0);
  });
  it("shear has a single eigen-direction", () => {
    const e = eigen([1, 1, 0, 1]);
    expect(e.values).toEqual([1, 1]);
    expect(Math.abs(e.vectors![0][1])).toBeCloseTo(0);
  });
  it("rotation has complex eigenvalues", () => {
    const e = eigen([0, -1, 1, 0]);
    expect(e.complex).toBe(true);
    expect(e.re).toBeCloseTo(0);
    expect(e.im).toBeCloseTo(1);
  });
});

describe("coordinates, inner products and projections", () => {
  it("coordinates rebuild the vector and are unique for a basis", () => {
    const b1 = [2, 1] as const, b2 = [-1, 1] as const, v = [3, 3] as const;
    const c = coordinates(b1, b2, v)!;
    expect(c[0] * b1[0] + c[1] * b2[0]).toBeCloseTo(3);
    expect(c[0] * b1[1] + c[1] * b2[1]).toBeCloseTo(3);
    expect(coordinates([1, 0], [0, 1], [4, -2])).toEqual([4, -2]);
    expect(coordinates([1, 2], [2, 4], [1, 1])).toBeNull();
    expect(coordinates([0, 0], [1, 0], [1, 1])).toBeNull();
  });
  it("the remainder is orthogonal to v, and the slack is ⟨v,v⟩‖u−tv‖² ≥ 0", () => {
    for (const g of [[1, 0, 0, 1], [2, 0, 0, 1], [2, 0.5, 0.5, 1]] as const) {
      for (const [u, v] of [[[1, 2], [3, -1]], [[2, 0], [1, 1]], [[-1, 1], [2, -2]]] as const) {
        const p = projection(g, u, v);
        expect(inner(g, p.r, v)).toBeCloseTo(0, 10);
        expect(p.slack).toBeCloseTo(p.vv * inner(g, p.r, p.r), 10);
        expect(p.slack).toBeGreaterThanOrEqual(-1e-12);
      }
    }
    // Equality exactly for dependent vectors.
    expect(projection([1, 0, 0, 1], [2, -4], [-1, 2]).slack).toBeCloseTo(0, 12);
  });
  it("orthogonality depends on the inner product", () => {
    expect(inner([1, 0, 0, 1], [1, 1], [1, -1])).toBe(0);
    expect(inner([2, 0, 0, 1], [1, 1], [1, -1])).toBe(1);
    expect(inner([2, 0, 0, 1], [1, 2], [1, -1])).toBe(0);
  });
});
