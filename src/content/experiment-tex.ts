import type { Locale } from "@/i18n/config";
import type { ExperimentKind } from "./graph";

/**
 * The formulas each experiment shows, as TeX. They are rendered on the server and handed to the
 * experiment as MathML (see src/components/content/Experiment.astro and useTex), so the browser needs no maths library.
 * Formulas must not depend on slider values; anything numeric is shown next to them as text.
 */
type Formula = string | Record<Locale, string>;

export const experimentTex: Partial<Record<ExperimentKind, Record<string, Formula>>> = {
  "birthday-problem": {
    exact: "1-\\frac{365\\cdot364\\cdots(365-n+1)}{365^n}",
    bound: "1-e^{-n(n-1)/730}",
  },
  "bayes-screening": {
    bayes: {
      zh: "P(\\text{病}\\mid +)=\\frac{P(+\\mid\\text{病})\\,P(\\text{病})}{P(+)}",
      en: "P(\\text{ill}\\mid +)=\\frac{P(+\\mid\\text{ill})\\,P(\\text{ill})}{P(+)}",
    },
  },
  "binomial-poisson": {
    binomial: "\\tbinom{n}{k}p^{k}(1-p)^{n-k}",
    poisson: "e^{-\\lambda}\\frac{\\lambda^{k}}{k!}",
    distance: "d=\\tfrac12\\sum_{k}\\bigl|P(X=k)-P(Y=k)\\bigr|",
  },
  "epsilon-band": {
    definition: "\\forall\\varepsilon>0\\ \\exists N\\ \\forall n>N:\\ |a_n-L|<\\varepsilon",
    ratio: "\\frac{n}{n+1}",
    alternating: "1+\\frac{(-1)^n}{n}",
    sine: "1+\\frac{\\sin n}{\\sqrt n}",
    sign: "(-1)^n",
  },
  "basis-coordinates": { combination: "v=c_1b_1+c_2b_2" },
  "projection-slack": {
    cauchySchwarz: "\\langle u,v\\rangle^2\\le\\|u\\|^2\\|v\\|^2",
    slack: "\\|u\\|^2\\|v\\|^2-\\langle u,v\\rangle^2=\\|v\\|^2\\,\\|u-tv\\|^2",
  },
  "exponential-derivative": { quotient: "\\frac{a^{x+h}-a^{x}}{h}=a^{x}\\cdot\\frac{a^{h}-1}{h}" },
  "secant-tangent": { quotient: "\\frac{f(x_0+h)-f(x_0)}{h}" },
  "riemann-sums": { sum: "\\sum_{i=1}^{n} f(\\xi_i)\\,\\Delta x" },
  "taylor-approx": { poly: "P_{n}(x)=\\sum_{k=0}^{n}\\frac{f^{(k)}(a)}{k!}(x-a)^{k}" },
  "ode-explorer": {
    exponential: "y' = k\\,y",
    logistic: "y' = r\\,y\\left(1-\\tfrac{y}{K}\\right)",
    harmonic: "x'' + 2\\gamma x' + \\omega^2 x = 0",
    pendulum: "\\theta'' + \\gamma\\theta' + \\tfrac{g}{L}\\sin\\theta = 0",
  },
};

export function formulasFor(kind: ExperimentKind, locale: Locale): Record<string, string> {
  const entries = Object.entries(experimentTex[kind] ?? {});
  return Object.fromEntries(entries.map(([k, v]) => [k, typeof v === "string" ? v : v[locale]]));
}
