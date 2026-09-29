import "server-only";
import type { Locale } from "@/i18n/config";
import type { Exercise } from "@/content/exercises";
import { richHtml } from "./rich";

/**
 * What an exercise card needs, in one language, with every text already rendered to HTML (maths
 * included) on the server. Client components receive this instead of the raw exercise, so neither
 * KaTeX nor the whole exercise bank ends up in the browser's JavaScript.
 * Hints and solutions are not included: they are fetched when the reader asks for them
 * (exerciseTextAction), so the page does not carry every solution up front.
 */
export type ExerciseView = {
  id: string;
  statement: string;
} & ({ kind: "numeric"; tolerance: number } | { kind: "choice"; options: string[] });

export function exerciseView(e: Exercise, locale: Locale): ExerciseView {
  const base = { id: e.id, statement: richHtml(e.statement[locale]) };
  return e.kind === "numeric"
    ? { ...base, kind: "numeric", tolerance: e.tolerance }
    : { ...base, kind: "choice", options: e.options.map((o) => richHtml(o[locale])) };
}
