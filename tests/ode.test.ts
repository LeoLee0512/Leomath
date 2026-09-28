import { describe, expect, it } from "vitest";
import { integrate, presets } from "@/lib/math/ode";

describe("ODE integrators", () => {
  const f = (_t: number, y: readonly number[]) => [y[0]];
  it("Euler with h=0.5 on y'=y gives 2.25 at t=1", () => {
    const { y } = integrate(f, [1], 0, 1, 0.5, "euler");
    expect(y[y.length - 1][0]).toBeCloseTo(2.25);
  });
  it("RK4 converges with order 4", () => {
    const err = (h: number) => Math.abs(integrate(f, [1], 0, 1, h, "rk4").y.at(-1)![0] - Math.E);
    const ratio = err(0.1) / err(0.05);
    expect(ratio).toBeGreaterThan(12);
    expect(ratio).toBeLessThan(20);
  });
  it("Euler converges with order 1", () => {
    const err = (h: number) => Math.abs(integrate(f, [1], 0, 1, h, "euler").y.at(-1)![0] - Math.E);
    const ratio = err(0.01) / err(0.005);
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(2.2);
  });
  it("damped oscillator closed form satisfies the initial conditions and the equation", () => {
    const p = presets.find((q) => q.id === "harmonic")!;
    const params = { omega: 1.3, gamma: 0.2 };
    const y0 = [1.5, 0.4];
    const exact = p.exact!(params, y0)!;
    expect(exact(0)[0]).toBeCloseTo(1.5);
    expect(exact(0)[1]).toBeCloseTo(0.4);
    // Compare with RK4 at fine step.
    const num = integrate(p.field(params), y0, 0, 5, 0.001, "rk4").y.at(-1)!;
    expect(num[0]).toBeCloseTo(exact(5)[0], 4);
    expect(num[1]).toBeCloseTo(exact(5)[1], 4);
  });
  it("logistic closed form matches RK4", () => {
    const p = presets.find((q) => q.id === "logistic")!;
    const params = { r: 1.5, K: 3 };
    const exact = p.exact!(params, [0.3])!;
    const num = integrate(p.field(params), [0.3], 0, 4, 0.001, "rk4").y.at(-1)!;
    expect(num[0]).toBeCloseTo(exact(4)[0], 5);
  });
});
