import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, getConcept, experimentsForConcept, publishedConcepts } from "@/content/graph";
import { exercisesForConcept } from "@/content/exercises";
import { ConceptSearch } from "@/components/ConceptSearch";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/learn", { title: t.learn.title, description: t.learn.subtitle });
}

export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const all = publishedConcepts().map((c) => ({ slug: c.slug, title: c.title[locale], summary: c.summary[locale] }));
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.learn.title}</h1>
      <p className="mt-3 text-ink-2">{t.learn.subtitle}</p>

      <div className="mt-12 grid gap-px bg-rule md:grid-cols-3 border border-rule">
        {paths.map((p) => {
          const nExp = new Set(p.concepts.flatMap((c) => experimentsForConcept(c).map((e) => e.slug))).size;
          const nEx = p.concepts.reduce((s, c) => s + exercisesForConcept(c).length, 0);
          return (
            <Link key={p.slug} href={`/${locale}/learn/${p.slug}`} className="bg-paper p-7 hover:bg-paper-2 transition-colors">
              <h2 className="display text-xl font-semibold">{p.title[locale]}</h2>
              <p className="mt-2 text-sm text-ink-2">{p.subtitle[locale]}</p>
              <ol className="mt-5 space-y-1 text-sm">
                {p.concepts.map((c, i) => (
                  <li key={c} className="flex gap-2"><span className="mono text-muted w-4">{i + 1}</span>{getConcept(c)!.title[locale]}</li>
                ))}
              </ol>
              <p className="mt-6 pt-4 border-t border-rule text-xs mono text-muted">{t.home.pathsCounts(p.concepts.length, nExp, nEx)}</p>
            </Link>
          );
        })}
      </div>

      <div id="search" className="mt-16 max-w-2xl">
        <ConceptSearch locale={locale} items={all} placeholder={t.nav.search} />
      </div>
    </div>
  );
}
