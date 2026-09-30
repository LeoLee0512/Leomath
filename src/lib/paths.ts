import type { Locale } from "@/i18n/config";
import { experimentsForConcept, type LearningPath } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import updated from "@/content/updated.json";
import { readingMinutesMap } from "./reading";

export interface PathStats {
  concepts: number;
  experiments: number;
  exercises: number;
  /** Total estimated reading time of the path's articles. */
  minutes: number;
  /** Last commit date of any of its articles, YYYY-MM-DD (from scripts/content-dates.mjs). */
  updated: string | null;
  /** Reading minutes per concept, for listing. */
  perConcept: Record<string, number>;
}

const dates = updated as Record<string, string>;

export async function pathStats(p: LearningPath, locale: Locale): Promise<PathStats> {
  const perConcept = await readingMinutesMap(p.concepts, locale);
  const days = p.concepts.map((c) => dates[c]).filter(Boolean).sort();
  return {
    concepts: p.concepts.length,
    experiments: new Set(p.concepts.flatMap((c) => experimentsForConcept(c).map((e) => e.slug))).size,
    exercises: p.concepts.reduce((s, c) => s + exercisesForConcept(c).length, 0),
    minutes: Object.values(perConcept).reduce((s, m) => s + m, 0),
    updated: days.at(-1) ?? null,
    perConcept,
  };
}
