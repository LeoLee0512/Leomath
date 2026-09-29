import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getConcept, publishedConcepts, experimentsForConcept, dependents, neighboursInPath, prerequisiteChain, getTool } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import { loadConceptArticle } from "@/lib/mdx";
import { mdxComponents } from "@/components/mdx-components";
import { currentUser } from "@/lib/auth";
import { getProgress, getExerciseSummary, type ProgressStatus } from "@/lib/progress";
import { setProgressAction } from "@/app/actions";
import { ExerciseSet } from "@/components/ExerciseSet";
import { ArticleNav } from "@/components/ArticleNav";
import { readingMinutes } from "@/lib/reading";
import { Comments } from "@/components/Comments";
import { CreditLine } from "@/components/CreditLine";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return publishedConcepts().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getConcept(slug);
  if (!c || !isLocale(locale)) return {};
  return pageMeta(locale, `/concepts/${slug}`, { title: c.title[locale], description: c.summary[locale], type: "article" });
}

export default async function ConceptPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, slug } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();
  const c = getConcept(slug);
  if (!c || c.status !== "published") notFound();
  const t = getDictionary(locale);
  const article = await loadConceptArticle(slug, locale);
  if (!article) notFound();
  const { Content, fallback, headings } = article;
  const minutes = await readingMinutes(slug, locale);
  const user = await currentUser();
  const progress = user ? await getProgress(user.id).catch(() => ({})) : {};
  const summary = user ? await getExerciseSummary(user.id).catch(() => ({})) : {};
  const status: ProgressStatus = (progress as Record<string, ProgressStatus | undefined>)[slug] ?? "none";
  const exps = experimentsForConcept(slug);
  const exs = exercisesForConcept(slug);
  const { prev, next, path } = neighboursInPath(slug);
  const chain = prerequisiteChain(slug).filter((s) => s !== slug);
  const after = dependents(slug);
  const chapter = path ? path.concepts.indexOf(slug) + 1 : 1;
  const navHeadings = exs.length > 0 ? [...headings, { id: "exercises", text: t.learn.exercises, depth: 2 as const }] : headings;

  return (
    <div className="container py-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0">
        <p className="eyebrow">
          {path && <Link href={`/${locale}/learn/${path.slug}`} className="hover:text-ink">{path.title[locale]}</Link>}
          {path && <span className="lg:hidden"> · {t.paths.step(chapter, path.concepts.length)}</span>}
        </p>
        <h1 className="display text-4xl md:text-[2.75rem] leading-tight font-semibold mt-3">{c.title[locale]}</h1>
        <p className="mt-3 text-lg text-ink-2 font-serif">{c.summary[locale]}</p>
        {minutes && <p className="mt-2 text-xs text-muted mono">{t.learn.readingTime(minutes)}</p>}
        {fallback && <p className="mt-6 text-sm text-muted border border-rule px-3 py-2 rounded">{t.learn.noTranslationEn}</p>}
        <div className="lg:hidden mt-6 border-y border-rule">
          <ArticleNav headings={navHeadings} label={t.learn.sections} variant="horizontal" />
        </div>
        <div className="prose-math mt-10">
          <Content components={mdxComponents(locale, chapter, query)} />
        </div>
        <CreditLine credits={c.credits} locale={locale} className="mt-10 border-t border-rule pt-4" />

        {exs.length > 0 && (
          <section className="mt-16">
            <h2 id="exercises" className="display text-2xl font-semibold border-t border-rule pt-8 scroll-mt-24">{t.learn.exercises}</h2>
            <div className="mt-3">
              <ExerciseSet
                exercises={exs}
                locale={locale}
                t={t.problems}
                summary={summary as Record<string, { attempts: number; solved: boolean }>}
                next={next ? { href: `/${locale}/concepts/${next.slug}`, title: next.title[locale] } : undefined}
              />
            </div>
          </section>
        )}

        <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-rule pt-6 text-sm">
          <div>
            {prev && (
              <Link href={`/${locale}/concepts/${prev.slug}`} className="block hover:text-leo">
                <span className="text-muted">← {t.learn.prevConcept}</span>
                <span className="block display text-lg mt-1">{prev.title[locale]}</span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link href={`/${locale}/concepts/${next.slug}`} className="block hover:text-leo">
                <span className="text-muted">{t.learn.nextConcept} →</span>
                <span className="block display text-lg mt-1">{next.title[locale]}</span>
              </Link>
            )}
          </div>
        </nav>

        <Comments type="concept" slug={slug} path={`/${locale}/concepts/${slug}`} locale={locale} t={t} />
      </article>

      <aside className="min-w-0 lg:sticky lg:top-20 self-start space-y-7 text-sm">
        {/* Where you are, where to go next, how to check yourself. */}
        {path && (
          <div className="border border-ink-2 rounded-[4px] p-4 bg-paper-2">
            <p className="eyebrow">
              <Link href={`/${locale}/learn/${path.slug}`} className="hover:text-ink">{path.title[locale]}</Link>
              <span className="mx-1.5">·</span>{t.paths.step(chapter, path.concepts.length)}
            </p>
            <ol className="mt-3 space-y-1">
              {path.concepts.map((s, i) => {
                const pc = getConcept(s)!;
                const here = s === slug;
                const isDone = (progress as Record<string, string>)[s] === "done";
                return (
                  <li key={s} className="flex gap-2">
                    <span className={`mono w-5 shrink-0 ${isDone ? "text-e2" : here ? "text-ink" : "text-muted"}`}>{isDone ? "✓" : here ? "◐" : i + 1}</span>
                    {here ? (
                      <span className="font-semibold text-ink" aria-current="step">{pc.title[locale]}</span>
                    ) : (
                      <Link href={`/${locale}/concepts/${s}`} className="text-ink-2 hover:text-leo">{pc.title[locale]}</Link>
                    )}
                  </li>
                );
              })}
            </ol>
            {exs.length > 0 && (
              <a href="#exercises" className="mt-4 block text-leo hover:underline">{t.paths.check(exs.length)}</a>
            )}
            {next ? (
              <Link href={`/${locale}/concepts/${next.slug}`} className="btn btn-primary btn-small mt-3 w-full justify-center">
                {t.paths.nextConcept(next.title[locale])}
              </Link>
            ) : (
              <p className="mt-3 text-xs text-muted">{t.paths.lastInPath}</p>
            )}
          </div>
        )}

        <div className="hidden lg:block">
          <ArticleNav headings={navHeadings} label={t.learn.sections} />
        </div>

        {user ? (
          <div>
            <p className="eyebrow mb-2">{t.auth.progressTitle}</p>
            <form action={setProgressAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="locale" value={locale} />
              <p className="w-full text-ink-2">{t.learn.status[status]}</p>
              {status !== "learning" && <button name="status" value="learning" className="btn btn-ghost btn-small">{t.learn.markLearning}</button>}
              {status !== "done" && <button name="status" value="done" className="btn btn-primary btn-small">{t.learn.markDone}</button>}
              {status !== "none" && <button name="status" value="none" className="btn btn-ghost btn-small">{t.learn.markReset}</button>}
            </form>
          </div>
        ) : (
          <p className="text-xs text-muted leading-relaxed">
            {t.paths.loginValue}{" "}
            <Link href={`/${locale}/login?next=/${locale}/concepts/${slug}`} className="text-leo hover:underline">{t.nav.login} →</Link>
          </p>
        )}

        {(chain.length > 0 || after.length > 0 || (c.tools?.length ?? 0) > 0 || exps.length > 0) && (
          <details className="group border-t border-rule pt-4">
            <summary className="cursor-pointer select-none eyebrow hover:text-ink">{t.paths.more}</summary>
            <div className="mt-4 space-y-6">
              {chain.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">{t.learn.prerequisites}</p>
                  <ol className="space-y-1">
                    {chain.map((s) => {
                      const pc = getConcept(s)!;
                      return (
                        <li key={s}>
                          {pc.status === "published" ? (
                            <Link href={`/${locale}/concepts/${s}`} className="hover:text-leo">{pc.title[locale]}</Link>
                          ) : (
                            <span className="text-muted">{pc.title[locale]}</span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {after.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">{t.learn.leadsTo}</p>
                  <ul className="space-y-1">
                    {after.map((d) => (
                      <li key={d.slug}>
                        {d.status === "published" ? (
                          <Link href={`/${locale}/concepts/${d.slug}`} className="hover:text-leo">{d.title[locale]}</Link>
                        ) : (
                          <span className="text-muted">{d.title[locale]} · {t.common.planned}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.tools && c.tools.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">{t.learn.tools}</p>
                  <ul className="space-y-1">
                    {c.tools.map((id) => { const tool = getTool(id)!; return (
                      <li key={id}><Link href={`/${locale}${tool.href}`} className="text-leo hover:underline">{tool.cta[locale]}</Link></li>
                    ); })}
                  </ul>
                </div>
              )}

              {exps.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">{t.learn.experiments}</p>
                  <ul className="space-y-1">
                    {exps.map((e) => (
                      <li key={e.slug}><Link href={`/${locale}/explore/${e.slug}`} className="hover:text-leo">{e.title[locale]}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}
      </aside>
    </div>
  );
}
