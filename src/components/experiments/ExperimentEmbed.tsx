import type { Locale } from "@/i18n/config";
import { getExperiment, type ExperimentKind } from "@/content/graph";
import { LinearTransform } from "./LinearTransform";
import { OdeExplorer } from "./OdeExplorer";
import { ExponentialDerivative } from "./ExponentialDerivative";
import { SecantTangent } from "./SecantTangent";
import { RiemannSums } from "./RiemannSums";
import { TaylorApprox } from "./TaylorApprox";
import { BirthdayProblem } from "./BirthdayProblem";
import { BayesScreening } from "./BayesScreening";
import { Conditioning } from "./Conditioning";
import { ObservationPanel } from "./ObservationPanel";
import { ExperimentShell } from "./ExperimentShell";
import { CreditLine } from "../CreditLine";

export type SearchParams = Record<string, string | string[] | undefined>;

/** This experiment's own parameters from the page query (`<slug>.<key>=…`), prefix removed. */
function experimentQuery(slug: string, searchParams?: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams ?? {})) {
    if (k.startsWith(`${slug}.`) && typeof v === "string") out[k.slice(slug.length + 1)] = v.slice(0, 64);
  }
  return out;
}

/** Renders an experiment by slug, with its toolbar, credits and observation questions. Usable from MDX and from pages. */
export function ExperimentEmbed({ slug, locale, preset, compact, withObservation = !compact, searchParams, backHref }: {
  slug: string;
  locale: Locale;
  preset?: string;
  compact?: boolean;
  withObservation?: boolean;
  /** The page's query, so shared links reproduce the sender's settings. */
  searchParams?: SearchParams;
  /** On the standalone experiment page: where the article discusses it. */
  backHref?: string;
}) {
  const exp = getExperiment(slug);
  if (!exp) return null;
  const frame = renderExperiment(exp.kind, locale, preset, compact);
  if (compact) return frame;
  return (
    <ExperimentShell
      slug={slug}
      locale={locale}
      query={experimentQuery(slug, searchParams)}
      backHref={backHref}
      after={
        <>
          {exp.credits?.length ? <CreditLine credits={exp.credits} locale={locale} className="mt-1" /> : null}
          {withObservation && exp.observe ? <ObservationPanel observe={exp.observe} locale={locale} /> : null}
        </>
      }
    >
      {frame}
    </ExperimentShell>
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
    case "birthday-problem":
      return <BirthdayProblem locale={locale} />;
    case "bayes-screening":
      return <BayesScreening locale={locale} />;
    case "conditioning":
      return <Conditioning locale={locale} />;
  }
}
