import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "@/i18n/config";

const CONTENT_ROOT = path.join(process.cwd(), "content", "concepts");

const cache = new Map<string, Promise<number | null>>();

/** Estimated reading time in minutes for a concept article (falls back to zh). Articles ship with the build, so it is computed once. */
export function readingMinutes(slug: string, locale: Locale): Promise<number | null> {
  const key = `${slug}/${locale}`;
  if (!cache.has(key)) cache.set(key, estimate(slug, locale));
  return cache.get(key)!;
}

async function estimate(slug: string, locale: Locale): Promise<number | null> {
  for (const l of [locale, "zh"] as Locale[]) {
    try {
      const src = await readFile(path.join(CONTENT_ROOT, slug, `${l}.mdx`), "utf8");
      const body = src.replace(/<[^>]+>/g, " ");
      const cjk = (body.match(/[一-鿿]/g) ?? []).length;
      const latin = (body.replace(/[一-鿿]/g, " ").match(/[A-Za-z]{2,}/g) ?? []).length;
      const math = (body.match(/\$/g) ?? []).length / 2;
      // ~350 CJK chars/min, ~200 words/min, and formulas slow reading down.
      const minutes = cjk / 350 + latin / 200 + math * 0.05;
      return Math.max(3, Math.round(minutes));
    } catch {
      continue;
    }
  }
  return null;
}

export async function readingMinutesMap(slugs: string[], locale: Locale): Promise<Record<string, number>> {
  const entries = await Promise.all(slugs.map(async (s) => [s, await readingMinutes(s, locale)] as const));
  return Object.fromEntries(entries.filter((e): e is readonly [string, number] => e[1] !== null));
}
