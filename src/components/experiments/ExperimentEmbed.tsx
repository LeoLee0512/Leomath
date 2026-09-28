import type { Locale } from "@/i18n/config";
import { getExperiment } from "@/content/graph";
import { LinearTransform } from "./LinearTransform";
import { OdeExplorer } from "./OdeExplorer";
import { ExponentialDerivative } from "./ExponentialDerivative";

/** Renders an experiment by slug. Usable from MDX and from pages. */
export function ExperimentEmbed({ slug, locale, preset, compact }: { slug: string; locale: Locale; preset?: string; compact?: boolean }) {
  const exp = getExperiment(slug);
  if (!exp) return null;
  switch (exp.kind) {
    case "linear-transform":
      return <LinearTransform locale={locale} compact={compact} />;
    case "ode-explorer":
      return <OdeExplorer locale={locale} preset={preset} />;
    case "exponential-derivative":
      return <ExponentialDerivative locale={locale} compact={compact} />;
  }
}
