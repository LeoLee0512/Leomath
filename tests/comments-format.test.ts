import { describe, expect, it } from "vitest";
import { authorLabel, formatCommentDate, maskEmail, normaliseBody } from "@/lib/comments-format";

describe("comment formatting", () => {
  it("masks emails down to two characters", () => {
    expect(maskEmail("leo@example.com")).toBe("le***");
    expect(maskEmail("a@b.c")).toBe("a***");
  });
  it("prefers the display name and falls back to the masked email", () => {
    expect(authorLabel("Leo", "leo@example.com")).toBe("Leo");
    expect(authorLabel("   ", "leo@example.com")).toBe("le***");
    expect(authorLabel(null, "leo@example.com")).toBe("le***");
  });
  it("normalises line endings and blank runs", () => {
    expect(normaliseBody("a\r\n\r\n\r\n\r\nb  \n")).toBe("a\n\nb");
  });
  it("formats dates per locale", () => {
    const d = new Date("2026-09-28T12:00:00Z");
    expect(formatCommentDate(d, "zh")).toContain("2026");
    expect(formatCommentDate(d, "en")).toMatch(/28 Sept? 2026/);
  });
});
