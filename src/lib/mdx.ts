import "server-only";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { ComponentType } from "react";
import type { Root, Element, Text } from "hast";
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
  const source = await readFile(file, "utf8");
  const headings: Heading[] = [];
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: "ignore", trust: false }], rehypeHeadings(headings)],
    development: false,
  });
  return { Content: Content as LoadedArticle["Content"], headings, locale: actual, fallback: actual !== locale };
}

export async function articleExists(slug: string, locale: Locale): Promise<boolean> {
  return exists(path.join(CONTENT_ROOT, slug, `${locale}.mdx`));
}
