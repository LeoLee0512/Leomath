import { describe, expect, it } from "vitest";
import { richHtml } from "@/lib/rich";
import { splitAtBinaries, splitAtRelations, splitNumberLists, tex } from "@/lib/tex";

describe("server-rendered rich text", () => {
  it("renders inline and display maths as MathML", () => {
    expect(richHtml("a $x^2$ b")).toMatch(/^a <math[^>]*>.*<\/math> b$/);
    expect(richHtml("$$\\frac12$$")).toMatch(/^<div class="math-display"><math[^>]*display="block"/);
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

  it("keeps punctuation on the same line as the formula next to it", () => {
    const html = richHtml("趋于 $1$，所以（$x$）");
    expect(html).toMatch(/<span class="math-glue"><math[^>]*>.*<\/math>，<\/span>所以/);
    expect(html).toMatch(/<span class="math-glue">（<math[^>]*>.*<\/math>）<\/span>$/);
    expect(richHtml("$a$ and $b$")).not.toContain("math-glue");
  });
});

describe("Temml output", () => {
  it("splits digits separated by commas back into a list", () => {
    expect(tex("[0,1]")).toContain("<mn>0</mn><mo separator=\"true\">,</mo><mn>1</mn>");
    expect(tex("k=0,1,2")).not.toContain("<mn>0,1,2</mn>");
    expect(splitNumberLists("<mn>0.5,1</mn>")).toBe('<mn>0.5</mn><mo separator="true">,</mo><mn>1</mn>');
    expect(tex("0.25")).toContain("<mn>0.25</mn>");
  });

  it("splits long inline formulas after top-level relations only", () => {
    expect(splitAtRelations("P(N=n\\mid M=m)=e^{-\\lambda}\\frac{a=b}{c}")).toEqual(["P(N=n\\mid M=m)=", "e^{-\\lambda}\\frac{a=b}{c}"]);
    expect(splitAtRelations("\\lim_{n\\to\\infty}a_n\\le\\left(1+x=y\\right)\\to 0")).toEqual(["\\lim_{n\\to\\infty}a_n\\le", "\\left(1+x=y\\right)\\to", " 0"]);
    expect(splitAtRelations("\\left(a=b")).toEqual(["\\left(a=b"]);
    expect(splitAtBinaries("(ay_1+by_2)''+p(ay_1+by_2)'-q")).toEqual(["(ay_1+by_2)''+", "p(ay_1+by_2)'-", "q"]);
    expect(splitAtBinaries("-a+b")).toEqual(["-a+", "b"]);
    expect(splitAtBinaries("x^{-1}+e^-y")).toEqual(["x^{-1}+", "e^-y"]);
    const long = tex("\\sum_k\\binom nk p^k(1-p)^{n-k}=(p+1-p)^n=1");
    expect(long.split("<wbr>")).toHaveLength(3);
    expect(tex("x=1")).not.toContain("<wbr>");
    expect(tex("\\sum_k\\binom nk p^k(1-p)^{n-k}=(p+1-p)^n=1", true)).not.toContain("<wbr>");
  });

  it("glues punctuation to the last part of a split formula, so it can still break", () => {
    const html = richHtml("得 $\\sum_k\\binom nk p^k(1-p)^{n-k}=(p+1-p)^n=1$，所以");
    const parts = html.split("<wbr>");
    expect(parts).toHaveLength(3);
    expect(parts[0]).not.toContain("math-glue");
    expect(parts[2]).toMatch(/^<span class="math-glue"><math[^>]*>.*<\/math>，<\/span>所以$/);
  });

  it("does not throw on bad input and never trusts commands like \\href", () => {
    expect(() => tex("\\frac{1")).not.toThrow();
    expect(tex("\\href{javascript:alert(1)}{x}")).not.toContain("javascript:");
  });
});
