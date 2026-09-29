import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, getConcept } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import { currentUser } from "@/lib/auth";
import { getExerciseSummary } from "@/lib/progress";
import { ExerciseCard } from "@/components/ExerciseCard";
import { exerciseView } from "@/lib/exercise-view";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/problems", { title: t.problems.title, description: t.problems.subtitle });
}

export default async function ProblemsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const user = await currentUser();
  const summary = user ? await getExerciseSummary(user.id).catch(() => ({})) : {};
  let n = 0;
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.problems.title}</h1>
      <p className="mt-3 text-ink-2 max-w-2xl">{t.problems.subtitle}</p>
      <div className="mt-12 space-y-16 max-w-3xl">
        {paths.map((p) => (
          <section key={p.slug}>
            <h2 className="display text-2xl font-semibold">{p.title[locale]}</h2>
            {p.concepts.map((slug) => {
              const c = getConcept(slug)!;
              const exs = exercisesForConcept(slug);
              return (
                <div key={slug} className="mt-8">
                  <h3 className="text-sm eyebrow mb-4">
                    <Link href={`/${locale}/concepts/${slug}`} className="hover:text-ink">{c.title[locale]}</Link>
                  </h3>
                  <div className="space-y-4">
                    {exs.map((e) => (
                      <ExerciseCard key={e.id} exercise={exerciseView(e, locale)} index={++n} locale={locale} t={t.problems} summary={(summary as Record<string, { attempts: number; solved: boolean }>)[e.id]} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
