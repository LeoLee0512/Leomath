import { describe, expect, it } from "vitest";
import { compile, evaluate, ExprError, parse } from "@/lib/math/expr";

describe("expression parser", () => {
  it("evaluates arithmetic with precedence and right-associative powers", () => {
    expect(evaluate("1 + 2 * 3")).toBe(7);
    expect(evaluate("2 ^ 3 ^ 2")).toBe(512);
    expect(evaluate("-2 ^ 2")).toBe(-4);
    expect(evaluate("2 ^ -1")).toBe(0.5);
    expect(evaluate("(1 + 2) * 3")).toBe(9);
    expect(evaluate("10 / 4")).toBe(2.5);
  });
  it("handles scientific notation and unicode operators", () => {
    expect(evaluate("1e3")).toBe(1000);
    expect(evaluate("2.5e-1")).toBe(0.25);
    expect(evaluate("3 × 4 − 2")).toBe(10);
    expect(evaluate("x²", { x: 3 })).toBe(9);
  });
  it("supports functions, constants and variables", () => {
    expect(evaluate("sin(pi/2)")).toBeCloseTo(1);
    expect(evaluate("sqrt(2) * 10^3")).toBeCloseTo(1414.2135, 3);
    expect(evaluate("ln(e)")).toBeCloseTo(1);
    expect(evaluate("max(1, 5, 3)")).toBe(5);
    expect(evaluate("a*x + b", { a: 2, x: 3, b: 1 })).toBe(7);
    expect(compile("a*x^2 + b*x + c").variables).toEqual(["a", "x", "b", "c"]);
    expect(compile("sin(x) + pi").variables).toEqual(["x"]);
  });
  it("allows implicit multiplication only in unambiguous places", () => {
    expect(evaluate("2x", { x: 4 })).toBe(8);
    expect(evaluate("2(x+1)", { x: 4 })).toBe(10);
    expect(evaluate("(x+1)(x-1)", { x: 3 })).toBe(8);
    expect(() => parse("2 3")).toThrow(ExprError);
    expect(() => parse("1.2.3")).toThrow(ExprError);
  });
  it("reports positions and codes", () => {
    try { parse("sin(x"); throw new Error("no"); } catch (e) { expect((e as ExprError).code).toBe("unclosed"); }
    try { parse("foo(1)"); throw new Error("no"); } catch (e) { expect((e as ExprError).code).toBe("unknown-name"); expect((e as ExprError).pos).toBe(0); }
    try { parse("sin(1, 2)"); throw new Error("no"); } catch (e) { expect((e as ExprError).code).toBe("arity"); }
    try { parse(""); throw new Error("no"); } catch (e) { expect((e as ExprError).code).toBe("empty"); }
    try { parse("1 +"); throw new Error("no"); } catch (e) { expect((e as ExprError).code).toBe("unexpected"); }
    try { evaluate("y + 1"); throw new Error("no"); } catch (e) { expect((e as ExprError).code).toBe("unknown-name"); }
  });
  it("treats names greedily", () => {
    expect(compile("ex").variables).toEqual(["ex"]);
    expect(evaluate("2e")).toBeCloseTo(2 * Math.E);
  });
});
