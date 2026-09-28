import type { ComponentType, ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { ExperimentEmbed } from "./experiments/ExperimentEmbed";

const labels = {
  zh: { definition: "定义", theorem: "定理", proposition: "命题", lemma: "引理", proof: "证明", observe: "观察", conjecture: "猜想", remark: "注", example: "例", application: "应用" },
  en: { definition: "Definition", theorem: "Theorem", proposition: "Proposition", lemma: "Lemma", proof: "Proof", observe: "Observe", conjecture: "Conjecture", remark: "Remark", example: "Example", application: "Application" },
} as const;

type Kind = keyof (typeof labels)["zh"];

function block(kind: Kind, cls: string, locale: Locale) {
  return function Block({ title, children }: { title?: string; children?: ReactNode }) {
    return (
      <section className={`mblock ${cls}`}>
        <div className="mblock-head">
          <b>{labels[locale][kind]}</b>
          {title ? <span> · {title}</span> : null}
        </div>
        {children}
        {kind === "proof" ? <div className="mblock-proof-end" /> : null}
      </section>
    );
  };
}

/** Components made available to every MDX article. */
export function mdxComponents(locale: Locale): Record<string, ComponentType<unknown>> {
  return {
    Definition: block("definition", "mblock-definition", locale),
    Theorem: block("theorem", "mblock-theorem", locale),
    Proposition: block("proposition", "mblock-theorem", locale),
    Lemma: block("lemma", "mblock-theorem", locale),
    Proof: block("proof", "mblock-proof", locale),
    Observe: block("observe", "mblock-observe", locale),
    Conjecture: block("conjecture", "mblock-observe", locale),
    Remark: block("remark", "", locale),
    Example: block("example", "", locale),
    Application: block("application", "", locale),
    Experiment: function Experiment({ slug, preset }: { slug: string; preset?: string }) {
      return <ExperimentEmbed slug={slug} locale={locale} preset={preset} />;
    },
  } as Record<string, ComponentType<unknown>>;
}
