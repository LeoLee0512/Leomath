import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getConcept, type LearningPath } from "@/content/graph";
import type { PathStats } from "@/lib/paths";

/** A path as a decision: who it is for, what it needs, what you get, how long it takes. */
export function PathCard({ p, stats, locale, t }: { p: LearningPath; stats: PathStats; locale: Locale; t: Dictionary["paths"] }) {
  return (
    <Link href={`/${locale}/learn/${p.slug}`} className="group bg-paper p-7 hover:bg-paper-2 transition-colors flex flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="display text-xl font-semibold group-hover:text-leo transition-colors">{p.title[locale]}</h3>
        <span className={`text-xs rounded-[3px] px-1.5 py-0.5 border ${p.level === "intro" ? "text-e2 border-e2/40" : "text-leo border-leo/40"}`}>{t.level[p.level]}</span>
      </div>
      <p className="mt-2 text-xs mono text-muted">
        {t.counts(stats.concepts, stats.experiments, stats.exercises)} · {t.minutes(stats.minutes)}
      </p>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex gap-2"><dt className="text-muted shrink-0">{t.audience}</dt><dd className="text-ink-2">{p.audience[locale]}</dd></div>
        <div className="flex gap-2"><dt className="text-muted shrink-0">{t.requires}</dt><dd className="text-ink-2">{p.requires[locale]}</dd></div>
      </dl>

      <p className="mt-5 text-sm text-muted">{t.outcome}</p>
      <p className="mt-1 text-ink leading-relaxed">{p.outcome[locale]}</p>

      <ol className="mt-5 space-y-1 text-sm text-ink-2 flex-1">
        {p.concepts.map((c, i) => (
          <li key={c} className="flex gap-2"><span className="mono text-muted w-4">{i + 1}</span>{getConcept(c)!.title[locale]}</li>
        ))}
      </ol>

      <div className="mt-6 pt-4 border-t border-rule flex items-center justify-between gap-3">
        <span className="text-sm text-leo font-medium group-hover:underline">{t.start}</span>
        {stats.updated && <span className="text-xs text-muted">{t.updated(stats.updated)}</span>}
      </div>
    </Link>
  );
}
