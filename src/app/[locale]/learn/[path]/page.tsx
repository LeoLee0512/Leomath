import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, getPath, getConcept, experimentsForConcept, nextInPath } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import { currentUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import { KnowledgeTree } from "@/components/KnowledgeTree";
import { pathStats } from "@/lib/paths";
import { CreditLine } from "@/components/CreditLine";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return paths.map((p) => ({ path: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; path: string }> }): Promise<Metadata> {
  const { locale, path } = await params;
  const p = getPath(path);
  return p && isLocale(locale) ? pageMeta(locale, `/learn/${path}`, { title: p.title[locale], description: `${p.subtitle[locale]}` }) : {};
}

export default async function PathPage({ params }: { params: Promise<{ locale: string; path: string }> }) {
  const { locale, path } = await params;
  if (!isLocale(locale)) notFound();
  const p = getPath(path);
  if (!p) notFound();
  const t = getDictionary(locale);
  const user = await currentUser();
  const progress = user ? await getProgress(user.id).catch(() => ({})) : {};
  const stats = await pathStats(p, locale);
  const minutes = stats.perConcept;
  const done = progress as Record<string, string>;
  const next = nextInPath(p, done);
  const finished = next.done === p.concepts.length;

  return (
    <div className="container py-14">
      <p className="eyebrow"><Link href={`/${locale}/learn`} className="hover:text-ink">{t.learn.title}</Link></p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="display text-4xl font-semibold">{p.title[locale]}</h1>
        <span className={`text-xs rounded-[3px] px-1.5 py-0.5 border ${p.level === "intro" ? "text-e2 border-e2/40" : "text-leo border-leo/40"}`}>{t.paths.level[p.level]}</span>
      </div>
      <p className="mt-3 text-ink-2 text-lg">{p.subtitle[locale]}</p>
      <p className="mt-2 text-xs mono text-muted">
        {t.paths.counts(stats.concepts, stats.experiments, stats.exercises)} · {t.paths.minutes(stats.minutes)}
        {stats.updated && <> · {t.paths.updated(stats.updated)}</>}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <dl className="space-y-3 text-[0.95rem]">
          <div><dt className="text-sm text-muted">{t.paths.audience}</dt><dd className="mt-0.5 text-ink-2">{p.audience[locale]}</dd></div>
          <div><dt className="text-sm text-muted">{t.paths.requires}</dt><dd className="mt-0.5 text-ink-2">{p.requires[locale]}</dd></div>
          <div><dt className="text-sm text-muted">{t.paths.outcome}</dt><dd className="mt-0.5 text-ink leading-relaxed">{p.outcome[locale]}</dd></div>
        </dl>

        {/* The one thing to do now. */}
        <div className="border border-ink-2 rounded-[4px] p-5 bg-paper-2">
          <p className="eyebrow">{t.paths.next}</p>
          {user && (
            <div className="mt-3">
              <p className="text-xs text-muted">{t.paths.progress(next.done, p.concepts.length)}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-rule overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={p.concepts.length} aria-valuenow={next.done} aria-label={t.paths.progress(next.done, p.concepts.length)}>
                <div className="h-full bg-e2" style={{ width: `${(100 * next.done) / p.concepts.length}%` }} />
              </div>
            </div>
          )}
          {finished ? (
            <p className="mt-3 text-sm text-ink-2 leading-relaxed">{t.paths.finished}</p>
          ) : (
            <>
              <p className="mt-3 display text-lg font-semibold">{t.paths.nextLine(next.index + 1, next.concept.title[locale])}</p>
              <p className="mt-1 text-sm text-ink-2">{next.concept.summary[locale]}</p>
              <Link href={`/${locale}/concepts/${next.concept.slug}`} className="btn btn-primary btn-small mt-4 inline-flex">
                {next.done > 0 ? t.paths.continue : t.paths.start}
              </Link>
              {minutes[next.concept.slug] && <span className="ml-3 text-xs text-muted">{t.paths.minutes(minutes[next.concept.slug])}</span>}
            </>
          )}
          {!user && <p className="mt-4 text-xs text-muted leading-relaxed">{t.paths.loginValue}</p>}
        </div>
      </div>
      <CreditLine credits={p.credits} locale={locale} className="mt-3" />

      <div className="mt-12 grid gap-12">
        <ol className="space-y-px bg-rule border border-rule">
          {p.concepts.map((slug, i) => {
            const c = getConcept(slug)!;
            const exps = experimentsForConcept(slug);
            const exs = exercisesForConcept(slug);
            const status = done[slug];
            return (
              <li key={slug} className="bg-paper">
                <Link href={`/${locale}/concepts/${slug}`} className="block p-6 hover:bg-paper-2 transition-colors">
                  <div className="flex items-baseline gap-4">
                    <span className={`mono ${status === "done" ? "text-e2" : "text-muted"}`}>{status === "done" ? "✓ " : ""}{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="display text-xl font-semibold">{c.title[locale]}</h2>
                    {status && <span className="ml-auto text-xs text-leo">{t.learn.status[status as "learning" | "done"]}</span>}
                  </div>
                  <p className="mt-2 text-sm text-ink-2 pl-10">{c.summary[locale]}</p>
                  <p className="mt-3 text-xs mono text-muted pl-10">
                    {minutes[slug] ? `${t.learn.readingTime(minutes[slug])} · ` : ""}{t.paths.conceptCounts(exps.length, exs.length)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
        <div>
          <p className="eyebrow mb-3">{t.learn.positionInTree}</p>
          <KnowledgeTree locale={locale} focus={p.concepts[p.concepts.length - 1]} minutes={minutes} />
        </div>
      </div>
    </div>
  );
}
