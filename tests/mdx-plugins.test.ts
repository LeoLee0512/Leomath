import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import { VFile } from "vfile";
import { remarkDisplayMathLines, rehypeLeoMath } from "@/lib/mdx-plugins";

type Node = { type: string; value?: string; name?: string; tagName?: string; children?: Node[]; attributes?: { name: string; value: unknown }[] };

/** The articles' hast, through the same plugins as the site (astro.config.mjs). */
function compile(source: string, file = "content/concepts/random-variables/zh.mdx"): Node {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDisplayMathLines)
    .use(remarkRehype, { passThrough: ["mdxjsEsm", "mdxFlowExpression", "mdxJsxFlowElement", "mdxJsxTextElement", "mdxTextExpression"] })
    .use(rehypeLeoMath);
  const vfile = new VFile({ path: path.resolve(file), value: source });
  return processor.runSync(processor.parse(vfile), vfile) as unknown as Node;
}

function walk(node: Node, visit: (n: Node) => void) {
  visit(node);
  for (const c of node.children ?? []) walk(c, visit);
}

const texOf = (n: Node) => String(n.attributes?.find((a) => a.name === "html")?.value ?? "");

describe("article compilation", () => {
  it("a line of only $$…$$ becomes a display equation, also inside a paragraph and a block", () => {
    const tree = compile("<Theorem>\n设 $x>0$，\n$$\\frac12$$\n于是得证。\n</Theorem>\n");
    const tex: Node[] = [];
    walk(tree, (n) => { if (n.name === "Tex") tex.push(n); });
    expect(tex).toHaveLength(2);
    expect(tex[1].type).toBe("mdxJsxFlowElement");
    expect(texOf(tex[1])).toContain('display="block"');
  });

  it("numbers blocks by chapter and gives headings ids", () => {
    const tree = compile("## A\n\n<Definition>\nx\n</Definition>\n\n<Theorem>\ny\n</Theorem>\n\n<Lemma>\nz\n</Lemma>\n");
    const blocks: string[] = [];
    let heading = "";
    walk(tree, (n) => {
      if (n.name === "Block") blocks.push(`${n.attributes!.find((a) => a.name === "kind")!.value} ${n.attributes!.find((a) => a.name === "n")?.value}`);
      if (n.tagName === "h2") heading = String((n as { properties?: { id?: string } }).properties?.id);
    });
    expect(blocks).toEqual(["Definition 3.1", "Theorem 3.1", "Lemma 3.2"]);
    expect(heading).toBe("sec-1");
  });

  it("leaves no LaTeX as plain text in any article", () => {
    const root = path.resolve("content/concepts");
    const leaks: string[] = [];
    for (const slug of readdirSync(root)) {
      for (const f of readdirSync(path.join(root, slug))) {
        const file = path.join(root, slug, f);
        walk(compile(readFileSync(file, "utf8"), file), (n) => {
          if (n.type === "text" && /\\[a-zA-Z]{2,}|\$\$/.test(n.value ?? "")) leaks.push(`${slug}/${f}: ${n.value!.trim().slice(0, 60)}`);
        });
      }
    }
    expect(leaks).toEqual([]);
  });
});
