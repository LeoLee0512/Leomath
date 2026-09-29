import { describe, expect, it } from "vitest";
import { richHtml } from "@/lib/rich";
import { exerciseView } from "@/lib/exercise-view";
import { getExercise } from "@/content/exercises";

describe("server-rendered rich text", () => {
  it("renders inline and display maths with KaTeX", () => {
    expect(richHtml("a $x^2$ b")).toContain('class="katex"');
    expect(richHtml("$$\\frac12$$")).toContain('class="katex-display"');
  });

  it("escapes everything outside maths", () => {
    const html = richHtml('<script>alert(1)</script> & "q"');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  it("supports bold and leaves lone dollar signs alone", () => {
    expect(richHtml("**note** text")).toBe("<strong>note</strong> text");
    expect(richHtml("costs $5")).toBe("costs $5");
  });
});

describe("exercise views for the browser", () => {
  it("carry rendered statements and options, but not hints or solutions", () => {
    const v = exerciseView(getExercise("conditional-probability-3")!, "en");
    expect(v.statement).toContain('class="katex"');
    expect(v.kind === "choice" && v.options.length).toBe(4);
    expect("hint" in v).toBe(false);
    expect("solution" in v).toBe(false);
  });
});
