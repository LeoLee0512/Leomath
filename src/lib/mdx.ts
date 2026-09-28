import "server-only";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { ComponentType } from "react";
import type { Locale } from "@/i18n/config";

const CONTENT_ROOT = path.join(process.cwd(), "content", "concepts");

export interface LoadedArticle {
  Content: ComponentType<{ components?: Record<string, ComponentType<unknown>> }>;
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
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: "ignore", trust: false }]],
    development: false,
  });
  return { Content: Content as LoadedArticle["Content"], locale: actual, fallback: actual !== locale };
}

export async function articleExists(slug: string, locale: Locale): Promise<boolean> {
  return exists(path.join(CONTENT_ROOT, slug, `${locale}.mdx`));
}
