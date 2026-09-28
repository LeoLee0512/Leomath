import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, getPath, getConcept, experimentsForConcept } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import { currentUser } from "@/lib/auth";
import { getProgress } from "@/lib/progress";
import { KnowledgeTree } from "@/components/KnowledgeTree";

export function generateStaticParams() {
  return paths.map((p) => ({ path: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; path: string }> }): Promise<Metadata> {
  const { locale, path } = await params;
  const p = getPath(path);
  return { title: p && isLocale(locale) ? p.title[locale] : "Path" };
}

export default async function PathPage({ params }: { params: Promise<{ locale: string; path: string }> }) {
  const { locale, path } = await params;
  if (!isLocale(locale)) notFound();
  const p = getPath(path);
  if (!p) notFound();
  const t = getDictionary(locale);
  const user = await currentUser();
  const progress = user ? await getProgress(user.id).catch(() => ({})) : {};

  return (
    <div className="container py-14">
      <p className="eyebrow"><Link href={`/${locale}/learn`} className="hover:text-ink">{t.learn.title}</Link></p>
      <h1 className="display text-4xl font-semibold mt-3">{p.title[locale]}</h1>
      <p className="mt-3 text-ink-2 text-lg">{p.subtitle[locale]}</p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <ol className="space-y-px bg-rule border border-rule">
          {p.concepts.map((slug, i) => {
            const c = getConcept(slug)!;
            const exps = experimentsForConcept(slug);
            const exs = exercisesForConcept(slug);
            const status = (progress as Record<string, string>)[slug];
            return (
              <li key={slug} className="bg-paper">
                <Link href={`/${locale}/concepts/${slug}`} className="block p-6 hover:bg-paper-2 transition-colors">
                  <div className="flex items-baseline gap-4">
                    <span className="mono text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="display text-xl font-semibold">{c.title[locale]}</h2>
                    {status && <span className="ml-auto text-xs text-leo">{t.learn.status[status as "learning" | "done"]}</span>}
                  </div>
                  <p className="mt-2 text-sm text-ink-2 pl-10">{c.summary[locale]}</p>
                  <p className="mt-3 text-xs mono text-muted pl-10">
                    {exps.length} {t.learn.experiments} · {exs.length} {t.learn.exercises}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
        <div>
          <p className="eyebrow mb-3">{t.learn.positionInTree}</p>
          <KnowledgeTree locale={locale} focus={p.concepts[p.concepts.length - 1]} />
        </div>
      </div>
    </div>
  );
}
