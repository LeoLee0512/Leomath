import type { ComponentType, ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { ExperimentEmbed, type SearchParams } from "./experiments/ExperimentEmbed";
import { getExperiment, getTool } from "@/content/graph";
import Link from "next/link";

const labels = {
  zh: {
    problem: "问题", observe: "观察", conjecture: "猜想",
    definition: "定义", theorem: "定理", proposition: "命题", lemma: "引理", corollary: "推论",
    proof: "证明", example: "例", application: "应用", remark: "注", warning: "常见错误", experiment: "交互实验",
  },
  en: {
    problem: "Problem", observe: "Observe", conjecture: "Conjecture",
    definition: "Definition", theorem: "Theorem", proposition: "Proposition", lemma: "Lemma", corollary: "Corollary",
    proof: "Proof", example: "Example", application: "Application", remark: "Remark", warning: "Common mistake", experiment: "Interactive experiment",
  },
} as const;

type Kind = keyof (typeof labels)["zh"];

interface BlockProps {
  title?: string;
  children?: ReactNode;
}

/**
 * Semantic mathematical blocks. Definitions, results (theorem/proposition/lemma/corollary)
 * and examples are numbered `chapter.n` within an article, in render order.
 */
export function mdxComponents(locale: Locale, chapter: number, searchParams?: SearchParams): Record<string, ComponentType<unknown>> {
  const L = labels[locale];
  const counters = { definition: 0, result: 0, example: 0 };
  const next = (key: keyof typeof counters) => `${chapter}.${++counters[key]}`;

  const numbered = (kind: Kind, counter: keyof typeof counters, cls: string) =>
    function Numbered({ title, children }: BlockProps) {
      const n = next(counter);
      return (
        <section className={`mblock ${cls}`} aria-label={`${L[kind]} ${n}`}>
          <div className="mblock-head">
            <b>{L[kind]} {n}</b>
            {title ? <span className="mblock-title">{title}</span> : null}
          </div>
          <div className="mblock-body">{children}</div>
        </section>
      );
    };

  const plain = (kind: Kind, cls: string) =>
    function Plain({ title, children }: BlockProps) {
      return (
        <section className={`mblock ${cls}`}>
          <div className="mblock-head">
            <b>{L[kind]}</b>
            {title ? <span className="mblock-title">{title}</span> : null}
          </div>
          <div className="mblock-body">{children}</div>
        </section>
      );
    };

  function Proof({ title, children }: BlockProps) {
    return (
      <section className="mblock mblock-proof">
        <div className="mblock-head">
          <b>{L.proof}</b>
          {title ? <span className="mblock-title">{title}</span> : null}
        </div>
        <div className="mblock-body">{children}</div>
        <div className="mblock-qed" aria-hidden="true">□</div>
      </section>
    );
  }

  function Experiment({ slug, preset }: { slug: string; preset?: string }) {
    const exp = getExperiment(slug);
    return (
      <figure className="mblock mblock-experiment">
        <figcaption className="mblock-head">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 1.5h4M7 1.5v5L2.5 13a1 1 0 0 0 .9 1.5h9.2a1 1 0 0 0 .9-1.5L9 6.5v-5" />
            <path d="M4.5 10.5h7" />
          </svg>
          <b>{L.experiment}</b>
          {exp ? <span className="mblock-title">{exp.title[locale]}</span> : null}
        </figcaption>
        <ExperimentEmbed slug={slug} locale={locale} preset={preset} searchParams={searchParams} />
      </figure>
    );
  }

  function Tool({ id }: { id: string }) {
    const tool = getTool(id);
    if (!tool) return null;
    return (
      <p className="mblock-tool">
        <Link href={`/${locale}${tool.href}`} className="text-leo hover:underline text-[0.95rem] font-sans">{tool.cta[locale]}</Link>
      </p>
    );
  }

  return {
    Tool,
    Problem: plain("problem", "mblock-problem"),
    Observe: plain("observe", "mblock-observe"),
    Conjecture: plain("conjecture", "mblock-conjecture"),
    Definition: numbered("definition", "definition", "mblock-definition"),
    Theorem: numbered("theorem", "result", "mblock-theorem"),
    Proposition: numbered("proposition", "result", "mblock-theorem"),
    Lemma: numbered("lemma", "result", "mblock-theorem"),
    Corollary: numbered("corollary", "result", "mblock-theorem"),
    Proof,
    Example: numbered("example", "example", "mblock-example"),
    Application: plain("application", "mblock-application"),
    Remark: plain("remark", "mblock-remark"),
    Warning: plain("warning", "mblock-warning"),
    Experiment,
  } as Record<string, ComponentType<unknown>>;
}
