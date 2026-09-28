import type { Locale } from "@/i18n/config";
import { getExperiment, type ExperimentKind } from "@/content/graph";
import { LinearTransform } from "./LinearTransform";
import { OdeExplorer } from "./OdeExplorer";
import { ExponentialDerivative } from "./ExponentialDerivative";
import { SecantTangent } from "./SecantTangent";
import { RiemannSums } from "./RiemannSums";
import { TaylorApprox } from "./TaylorApprox";
import { ObservationPanel } from "./ObservationPanel";

/** Renders an experiment by slug. Usable from MDX and from pages. */
export function ExperimentEmbed({ slug, locale, preset, compact, withObservation = !compact }: { slug: string; locale: Locale; preset?: string; compact?: boolean; withObservation?: boolean }) {
  const exp = getExperiment(slug);
  if (!exp) return null;
  const body = renderExperiment(exp.kind, locale, preset, compact);
  if (!withObservation || !exp.observe) return body;
  return (
    <div>
      {body}
      <ObservationPanel observe={exp.observe} locale={locale} />
    </div>
  );
}

function renderExperiment(kind: ExperimentKind, locale: Locale, preset?: string, compact?: boolean) {
  switch (kind) {
    case "linear-transform":
      return <LinearTransform locale={locale} compact={compact} />;
    case "ode-explorer":
      return <OdeExplorer locale={locale} preset={preset} />;
    case "exponential-derivative":
      return <ExponentialDerivative locale={locale} compact={compact} />;
    case "secant-tangent":
      return <SecantTangent locale={locale} />;
    case "riemann-sums":
      return <RiemannSums locale={locale} />;
    case "taylor-approx":
      return <TaylorApprox locale={locale} />;
  }
}
