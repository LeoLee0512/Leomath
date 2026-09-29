import { describe, expect, it } from "vitest";
import { parseUrlValue } from "@/components/experiments/urlState";
import { integrate } from "@/lib/math/ode";

// Values come from a URL anyone can craft; each must end up inside what the control allows.
describe("reading experiment parameters from the URL", () => {
  const range = { min: 1, max: 200, integer: true };

  it("clamps numbers to the control's range and rounds counts", () => {
    expect(parseUrlValue("1e15", 8, range)).toBe(200);
    expect(parseUrlValue("-5", 8, range)).toBe(1);
    expect(parseUrlValue("12.6", 8, range)).toBe(13);
    expect(parseUrlValue("0", 0.25, { min: 0.01, max: 1 })).toBe(0.01);
  });

  it("falls back to the default for missing, empty or unreadable values", () => {
    expect(parseUrlValue(undefined, 8, range)).toBe(8);
    expect(parseUrlValue(null, 8, range)).toBe(8);
    expect(parseUrlValue("", 0.25, { min: 0.01, max: 1 })).toBe(0.25);
    expect(parseUrlValue("abc", 8, range)).toBe(8);
    expect(parseUrlValue("Infinity", 8, range)).toBe(8);
  });

  it("accepts only listed strings", () => {
    const ids = ["exponential", "logistic"];
    expect(parseUrlValue("logistic", "exponential", ids)).toBe("logistic");
    expect(parseUrlValue("bogus", "exponential", ids)).toBe("exponential");
    expect(parseUrlValue("<script>", "exponential", ids)).toBe("exponential");
  });

  it("reads booleans strictly", () => {
    expect(parseUrlValue("1", false)).toBe(true);
    expect(parseUrlValue("0", true)).toBe(false);
    expect(parseUrlValue("yes", false)).toBe(false);
  });

  it("caps free text", () => {
    expect((parseUrlValue("x".repeat(500), "") as string).length).toBe(64);
  });
});

describe("the ODE integrator refuses runaway sizes", () => {
  const f = (_t: number, y: readonly number[]) => [y[0]];
  it("returns only the initial point for a zero or invalid step", () => {
    expect(integrate(f, [1], 0, 3, 0, "euler").t).toEqual([0]);
    expect(integrate(f, [1], 0, 3, Number.NaN, "rk4").t).toEqual([0]);
    expect(integrate(f, [1], 0, 3, -1, "rk4").t).toEqual([0]);
  });
  it("caps the number of steps", () => {
    expect(integrate(f, [1], 0, 3, 1e-9, "euler").t.length).toBeLessThanOrEqual(20_001);
  });
});
