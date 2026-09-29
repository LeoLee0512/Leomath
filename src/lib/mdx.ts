import "server-only";
import { readFile, access, stat } from "node:fs/promises";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit, SKIP } from "unist-util-visit";
import { tex } from "./katex";
import type { ComponentType } from "react";
import type { Root, Element, Text, ElementContent, RootContent } from "hast";
import type { Locale } from "@/i18n/config";

const CONTENT_ROOT = path.join(process.cwd(), "content", "concepts");

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface LoadedArticle {
  Content: ComponentType<{ components?: Record<string, ComponentType<unknown>> }>;
  headings: Heading[];
  /** Locale the article was actually loaded in (may differ from the requested one when falling back). */
  locale: Locale;
  fallback: boolean;
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function textOf(node: Element | Text): string {
  if (node.type === "text") return node.value;
  return node.children.map((c) => (c.type === "text" || c.type === "element" ? textOf(c) : "")).join("");
}

/** Gives h2/h3 headings stable ids (sec-1, sec-2, …) and collects them for the article navigator. */
function rehypeHeadings(headings: Heading[]) {
  return () => (tree: Root) => {
    let n = 0;
    const walk = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        if (child.tagName === "h2" || child.tagName === "h3") {
          n += 1;
          const id = `sec-${n}`;
          child.properties = { ...child.properties, id };
          headings.push({ id, text: textOf(child).trim(), depth: child.tagName === "h2" ? 2 : 3 });
        }
        walk(child);
      }
    };
    walk(tree);
  };
}

/**
 * Articles write display equations on one line, `$$…$$`. remark-math parses that as inline math,
 * so a line holding nothing but `$$…$$` is rewritten into the fenced block form it was meant as.
 * Keep in sync with scripts/compile-mdx.mjs.
 */
export function displayMathBlocks(source: string): string {
  return source.replace(/^([ \t]*)\$\$(?!\$)(.+?)\$\$[ \t]*$/gm, "$1$$$$\n$1$2\n$1$$$$");
}

/**
 * Renders every formula with KaTeX at compile time and embeds it as one HTML string (`<Tex html="…">`),
 * instead of turning KaTeX's markup into a tree of React elements. The page's React payload then carries
 * each formula once, as a compact string, rather than as dozens of nested element records.
 */
function rehypeTex() {
  const text = (node: Element): string => node.children.map((c) => (c.type === "text" ? c.value : c.type === "element" ? text(c) : "")).join("");
  const isMath = (node: ElementContent | RootContent, kind: string): node is Element =>
    node.type === "element" && node.tagName === "code" && Array.isArray(node.properties?.className) && node.properties.className.includes(kind);
  const texNode = (source: string, display: boolean) => ({
    type: display ? "mdxJsxFlowElement" : "mdxJsxTextElement",
    name: "Tex",
    attributes: [
      { type: "mdxJsxAttribute", name: "html", value: tex(source, display) },
      ...(display ? [{ type: "mdxJsxAttribute", name: "display", value: null }] : []),
    ],
    children: [],
  }) as unknown as Element;
  return () => (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.tagName === "pre" && node.children.length === 1 && isMath(node.children[0], "math-display")) {
        parent.children[index] = texNode(text(node.children[0] as Element), true);
        return [SKIP, index];
      }
      if (isMath(node, "math-inline")) {
        parent.children[index] = texNode(text(node), false);
        return [SKIP, index];
      }
    });
  };
}

/**
 * Compiled articles, kept per file and re-compiled only when the file changes on disk.
 * Compiling MDX with maths took most of a concept page's server time on every request.
 */
const compiled = new Map<string, { mtime: number; Content: LoadedArticle["Content"]; headings: Heading[] }>();

async function compileArticle(file: string) {
  const mtime = (await stat(file)).mtimeMs;
  const hit = compiled.get(file);
  if (hit && hit.mtime === mtime) return hit;
  const source = await readFile(file, "utf8");
  const headings: Heading[] = [];
  const { default: Content } = await evaluate(displayMathBlocks(source), {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeTex(), rehypeHeadings(headings)],
    development: false,
  });
  const entry = { mtime, Content: Content as LoadedArticle["Content"], headings };
  compiled.set(file, entry);
  return entry;
}

/** Load content/concepts/<slug>/<locale>.mdx, falling back to Chinese when a translation is missing. */
export async function loadConceptArticle(slug: string, locale: Locale): Promise<LoadedArticle | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const dir = path.join(CONTENT_ROOT, slug);
  let actual: Locale = locale;
  let file = path.join(dir, `${locale}.mdx`);
  if (!(await exists(file))) {
    actual = "zh";
    file = path.join(dir, "zh.mdx");
    if (!(await exists(file))) return null;
  }
  const { Content, headings } = await compileArticle(file);
  return { Content, headings, locale: actual, fallback: actual !== locale };
}

export async function articleExists(slug: string, locale: Locale): Promise<boolean> {
  return exists(path.join(CONTENT_ROOT, slug, `${locale}.mdx`));
}
