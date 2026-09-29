import { describe, expect, it } from "vitest";
import { clear, isLimited, record } from "@/lib/rate-limit";

describe("failure counters", () => {
  it("limits after the allowed number of failures, within the window", () => {
    const key = "test:limit";
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(isLimited(key, 5, t0 + i)).toBe(false);
      record(key, 60_000, t0 + i);
    }
    expect(isLimited(key, 5, t0 + 10)).toBe(true);
    // The window ends and the key is free again.
    expect(isLimited(key, 5, t0 + 60_001)).toBe(false);
  });

  it("clears a key after success", () => {
    const key = "test:clear";
    for (let i = 0; i < 3; i++) record(key, 60_000);
    expect(isLimited(key, 3)).toBe(true);
    clear(key);
    expect(isLimited(key, 3)).toBe(false);
  });

  it("keys are independent", () => {
    record("test:a", 60_000);
    expect(isLimited("test:b", 1)).toBe(false);
    expect(isLimited("test:a", 1)).toBe(true);
  });
});
