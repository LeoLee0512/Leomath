import type { ComponentType } from "react";
import type { Locale } from "@/i18n/config";
import { ExperimentShell } from "../ExperimentShell";
import { TexProvider } from "../texContext";

export interface ExperimentIslandProps {
  slug: string;
  locale: Locale;
  /** The experiment's formulas as server-rendered MathML (src/content/experiment-tex.ts). */
  formulas: Record<string, string>;
  /** This experiment's parameters from the page URL, so a shared link opens with the same settings. */
  query?: Record<string, string>;
  /** On the standalone experiment page: where the article discusses it. */
  backHref?: string;
  preset?: string;
  /** Home page: the experiment alone, without the Reset / Copy link toolbar. */
  compact?: boolean;
}

type ExperimentComponent = ComponentType<{ locale: Locale; preset?: string; compact?: boolean }>;

/**
 * One experiment as an Astro island: the experiment itself inside its URL-state shell and formula context.
 * Each experiment has its own island file (this folder), so a page downloads only the experiment it shows.
 */
export function island(Experiment: ExperimentComponent) {
  return function ExperimentIsland({ slug, locale, formulas, query = {}, backHref, preset, compact }: ExperimentIslandProps) {
    const inner = (
      <TexProvider html={formulas}>
        <Experiment locale={locale} preset={preset} compact={compact} />
      </TexProvider>
    );
    if (compact) return inner;
    return (
      <ExperimentShell slug={slug} locale={locale} query={query} backHref={backHref}>
        {inner}
      </ExperimentShell>
    );
  };
}
