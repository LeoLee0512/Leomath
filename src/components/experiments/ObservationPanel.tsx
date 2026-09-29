"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";

const copy = {
  zh: { title: "你观察到了什么？", lead: "先动手，再回答。想清楚之后再看解释。", show: "查看解释", hide: "收起解释" },
  en: { title: "What did you observe?", lead: "Play first, then answer. Read the explanation only after you have thought it through.", show: "Show explanation", hide: "Hide explanation" },
};

/** Experiment → observation → conjecture → theory: the questions that turn a visualisation into an experiment. */
/** Questions and explanation arrive as server-rendered HTML (maths included), so no KaTeX is needed here. */
export function ObservationPanel({ questionsHtml, explanationHtml, locale }: { questionsHtml: string[]; explanationHtml: string; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const t = copy[locale];
  return (
    <section className="mt-4 border-l-2 border-dotted border-accent-2 pl-5 py-1">
      <p className="mblock-head"><b>{t.title}</b><span className="mblock-title">{t.lead}</span></p>
      <ol className="mt-2 space-y-2 text-[0.97rem] leading-relaxed prose-math">
        {questionsHtml.map((q, i) => (
          <li key={i} className="flex gap-3">
            <span className="mono text-muted shrink-0">{i + 1}.</span>
            <span dangerouslySetInnerHTML={{ __html: q }} />
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-ghost btn-small mt-4" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? t.hide : t.show}
      </button>
      {open && (
        <div className="mt-3 prose-math text-[0.97rem] border-t border-rule pt-3">
          <div dangerouslySetInnerHTML={{ __html: explanationHtml }} />
        </div>
      )}
    </section>
  );
}
