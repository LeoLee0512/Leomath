/**
 * Compile-time steps for the concept articles (content/concepts/<slug>/<locale>.mdx), used by Astro's MDX
 * pipeline (astro.config.mjs) and by scripts/compile-mdx.mjs:
 *   remarkDisplayMathLines  a line holding only $$…$$ becomes a display equation;
 *   rehypeLeoMath           every formula rendered once to MathML (<Tex html>), with the punctuation around
 *                           inline formulas kept on their line; semantic blocks numbered chapter.n
 *                           (Definition 3.1, Theorem 3.2 …); headings given ids sec-1, sec-2 ….
 */
import path from "node:path";
import { visit, SKIP } from "unist-util-visit";
import type { Root as MdastRoot, Paragraph, PhrasingContent, RootContent as MdastContent } from "mdast";
import type { Root, Element, ElementContent, RootContent, Text } from "hast";
import type { VFile } from "vfile";
import { CLOSING_PUNCTUATION, OPENING_PUNCTUATION, glued, tex } from "./tex";
import { getConcept, getPath } from "../content/graph";

/**
 * Articles write display equations on one line, `$$…$$`, often inside a paragraph. remark-math reads
 * those as inline maths; here each such line is lifted out of its paragraph into a display block.
 */
export function remarkDisplayMathLines() {
  return (tree: MdastRoot, file: VFile) => {
    const source = String(file.value);
    const isDisplayLine = (node: PhrasingContent, prev?: PhrasingContent, next?: PhrasingContent) => {
      if (node.type !== "inlineMath" || !node.position) return false;
      if (!source.startsWith("$$", node.position.start.offset)) return false;
      const alone = (n: PhrasingContent | undefined, side: "prev" | "next") =>
        n === undefined || (n.type === "text" && (side === "prev" ? /\n[ \t]*$/.test(n.value) : /^[ \t]*\n/.test(n.value)));
      return alone(prev, "prev") && alone(next, "next");
    };
    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!parent || index === undefined) return;
      const kids = node.children;
      if (!kids.some((k, i) => isDisplayLine(k, kids[i - 1], kids[i + 1]))) return;
      const out: MdastContent[] = [];
      let run: PhrasingContent[] = [];
      const flush = () => {
        // Drop the line breaks that separated the text from the equation.
        if (run.length && run[0].type === "text") run[0] = { ...run[0], value: run[0].value.replace(/^[ \t]*\n/, "") };
        const last = run.at(-1);
        if (last?.type === "text") run[run.length - 1] = { ...last, value: last.value.replace(/\n[ \t]*$/, "") };
        run = run.filter((n) => !(n.type === "text" && n.value === ""));
        if (run.length) out.push({ type: "paragraph", children: run });
        run = [];
      };
      kids.forEach((k, i) => {
        if (isDisplayLine(k, kids[i - 1], kids[i + 1]) && k.type === "inlineMath") {
          flush();
          // The same HTML hint remark-math gives display maths (<pre><code class="math-display">), which rehypeLeoMath renders.
          const code = { type: "element" as const, tagName: "code", properties: { className: ["language-math", "math-display"] }, children: [{ type: "text" as const, value: k.value }] };
          out.push({ type: "math", value: k.value, data: { hName: "pre", hChildren: [code] } });
        } else run.push(k);
      });
      flush();
      parent.children.splice(index, 1, ...(out as typeof parent.children));
      return [SKIP, index + out.length];
    });
  };
}

const NUMBERED: Record<string, "definition" | "result" | "example"> = {
  Definition: "definition", Theorem: "result", Proposition: "result", Lemma: "result", Corollary: "result", Example: "example",
};
const PLAIN = new Set(["Problem", "Observe", "Conjecture", "Application", "Remark", "Warning", "Proof"]);

type JsxElement = { type: "mdxJsxFlowElement" | "mdxJsxTextElement"; name: string | null; attributes: { type: string; name: string; value: unknown }[]; children: unknown[] };
const attr = (name: string, value: string) => ({ type: "mdxJsxAttribute", name, value });

/** Which section of its path an article is (its chapter number), from content/concepts/<slug>/<locale>.mdx. */
export function chapterOf(file: string): number {
  const slug = path.basename(path.dirname(file));
  const c = getConcept(slug);
  const p = c?.path ? getPath(c.path) : undefined;
  return p ? p.concepts.indexOf(slug) + 1 : 1;
}

export function rehypeLeoMath() {
  const text = (node: Element): string => node.children.map((c) => (c.type === "text" ? c.value : c.type === "element" ? text(c) : "")).join("");
  const isMath = (node: ElementContent | RootContent | undefined, kind: string): node is Element =>
    node?.type === "element" && node.tagName === "code" && Array.isArray(node.properties?.className) && (node.properties.className as string[]).includes(kind);
  const texNode = (html: string, display: boolean) =>
    ({ type: display ? "mdxJsxFlowElement" : "mdxJsxTextElement", name: "Tex", attributes: [attr("html", html), ...(display ? [attr("display", "1")] : [])], children: [] }) as unknown as Element;

  return (tree: Root, file: VFile) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.tagName === "pre" && node.children.length === 1 && isMath(node.children[0], "math-display")) {
        parent.children[index] = texNode(tex(text(node.children[0] as Element), true), true);
        return [SKIP, index];
      }
      if (isMath(node, "math-inline")) {
        const siblings = parent.children;
        const next = siblings[index + 1];
        const prev = siblings[index - 1];
        let after = "";
        let before = "";
        if (next?.type === "text") {
          const m = next.value.match(CLOSING_PUNCTUATION);
          if (m) {
            after = m[0];
            (next as Text).value = next.value.slice(after.length);
          }
        }
        if (prev?.type === "text") {
          const m = prev.value.match(OPENING_PUNCTUATION);
          if (m) {
            before = m[0];
            (prev as Text).value = prev.value.slice(0, -before.length);
          }
        }
        siblings[index] = texNode(glued(before, tex(text(node), false), after), false);
        return [SKIP, index + 1];
      }
    });

    const chapter = file.path ? chapterOf(file.path) : 1;
    const counters = { definition: 0, result: 0, example: 0 };
    let heading = 0;
    visit(tree, (node) => {
      const n = node as unknown as Element | JsxElement;
      if (n.type === "element" && (n.tagName === "h2" || n.tagName === "h3")) {
        n.properties = { ...n.properties, id: `sec-${++heading}` };
        return;
      }
      if (n.type !== "mdxJsxFlowElement" || !n.name) return;
      const kind = n.name;
      if (!(kind in NUMBERED) && !PLAIN.has(kind)) return;
      n.attributes.push(attr("kind", kind));
      if (kind in NUMBERED) n.attributes.push(attr("n", `${chapter}.${++counters[NUMBERED[kind]]}`));
      n.name = "Block";
    });
  };
}
