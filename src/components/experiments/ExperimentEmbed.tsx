import type { Locale } from "@/i18n/config";
import dynamic from "next/dynamic";
import { getExperiment, type ExperimentKind } from "@/content/graph";
import { ObservationPanel } from "./ObservationPanel";
import { ExperimentShell } from "./ExperimentShell";
import { CreditLine } from "../CreditLine";
import { TexProvider } from "./texContext";
import { formulasFor } from "@/content/experiment-tex";
import { tex } from "@/lib/katex";
import { richHtml } from "@/lib/rich";

/** The experiment's formulas as HTML, rendered here on the server. */
function formulaHtml(kind: ExperimentKind, locale: Locale): Record<string, string> {
  return Object.fromEntries(Object.entries(formulasFor(kind, locale)).map(([k, v]) => [k, tex(v)]));
}

// One chunk per experiment: a page downloads only the experiments it shows (still rendered on the server).
const LinearTransform = dynamic(() => import("./LinearTransform").then((m) => m.LinearTransform));
const OdeExplorer = dynamic(() => import("./OdeExplorer").then((m) => m.OdeExplorer));
const ExponentialDerivative = dynamic(() => import("./ExponentialDerivative").then((m) => m.ExponentialDerivative));
const SecantTangent = dynamic(() => import("./SecantTangent").then((m) => m.SecantTangent));
const RiemannSums = dynamic(() => import("./RiemannSums").then((m) => m.RiemannSums));
const TaylorApprox = dynamic(() => import("./TaylorApprox").then((m) => m.TaylorApprox));
const BirthdayProblem = dynamic(() => import("./BirthdayProblem").then((m) => m.BirthdayProblem));
const BayesScreening = dynamic(() => import("./BayesScreening").then((m) => m.BayesScreening));
const Conditioning = dynamic(() => import("./Conditioning").then((m) => m.Conditioning));
const BinomialPoisson = dynamic(() => import("./BinomialPoisson").then((m) => m.BinomialPoisson));

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
  const frame = <TexProvider html={formulaHtml(exp.kind, locale)}>{renderExperiment(exp.kind, locale, preset, compact)}</TexProvider>;
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
          {withObservation && exp.observe ? <ObservationPanel questionsHtml={exp.observe.questions.map((q) => richHtml(q[locale]))} explanationHtml={richHtml(exp.observe.explanation[locale])} locale={locale} /> : null}
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
    case "binomial-poisson":
      return <BinomialPoisson locale={locale} />;
  }
}
