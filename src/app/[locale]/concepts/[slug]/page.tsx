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
import { ExerciseCard } from "@/components/ExerciseCard";
import { ArticleNav } from "@/components/ArticleNav";
import { readingMinutes } from "@/lib/reading";
import { Comments } from "@/components/Comments";

export function generateStaticParams() {
  return publishedConcepts().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getConcept(slug);
  if (!c || !isLocale(locale)) return {};
  return { title: c.title[locale], description: c.summary[locale] };
}

export default async function ConceptPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
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
        </p>
        <h1 className="display text-4xl md:text-[2.75rem] leading-tight font-semibold mt-3">{c.title[locale]}</h1>
        <p className="mt-3 text-lg text-ink-2 font-serif">{c.summary[locale]}</p>
        {minutes && <p className="mt-2 text-xs text-muted mono">{t.learn.readingTime(minutes)}</p>}
        {fallback && <p className="mt-6 text-sm text-muted border border-rule px-3 py-2 rounded">{t.learn.noTranslationEn}</p>}
        <div className="lg:hidden mt-6 border-y border-rule">
          <ArticleNav headings={navHeadings} label={t.learn.sections} variant="horizontal" />
        </div>
        <div className="prose-math mt-10">
          <Content components={mdxComponents(locale, chapter)} />
        </div>

        {exs.length > 0 && (
          <section className="mt-16">
            <h2 id="exercises" className="display text-2xl font-semibold border-t border-rule pt-8 scroll-mt-24">{t.learn.exercises}</h2>
            <div className="mt-6 space-y-6">
              {exs.map((e, i) => (
                <ExerciseCard key={e.id} exercise={e} index={i + 1} locale={locale} t={t.problems} summary={(summary as Record<string, { attempts: number; solved: boolean }>)[e.id]} />
              ))}
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

      <aside className="min-w-0 lg:sticky lg:top-20 self-start space-y-8 text-sm">
        <div className="hidden lg:block">
          <ArticleNav headings={navHeadings} label={t.learn.sections} />
        </div>
        <div>
          <p className="eyebrow mb-2">{t.auth.progressTitle}</p>
          {user ? (
            <form action={setProgressAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="locale" value={locale} />
              <p className="w-full text-ink-2">{t.learn.status[status]}</p>
              {status !== "learning" && <button name="status" value="learning" className="btn btn-ghost btn-small">{t.learn.markLearning}</button>}
              {status !== "done" && <button name="status" value="done" className="btn btn-primary btn-small">{t.learn.markDone}</button>}
              {status !== "none" && <button name="status" value="none" className="btn btn-ghost btn-small">{t.learn.markReset}</button>}
            </form>
          ) : (
            <p className="text-muted">
              <Link href={`/${locale}/login?next=/${locale}/concepts/${slug}`} className="text-leo hover:underline">{t.nav.login}</Link> · {t.learn.loginToTrack}
            </p>
          )}
        </div>

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
      </aside>
    </div>
  );
}
