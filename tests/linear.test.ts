import { describe, expect, it } from "vitest";
import { apply, det, eigen, fromColumns, multiply, type Mat2 } from "@/lib/math/linear";

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
