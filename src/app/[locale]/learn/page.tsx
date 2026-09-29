import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, publishedConcepts } from "@/content/graph";
import { PathCard } from "@/components/PathCard";
import { pathStats } from "@/lib/paths";
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
  const stats = await Promise.all(paths.map((p) => pathStats(p, locale)));
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.learn.title}</h1>
      <p className="mt-3 text-ink-2">{t.learn.subtitle}</p>

      <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">{t.paths.choose}</p>
      <div className="mt-10 grid gap-px bg-rule md:grid-cols-2 border border-rule">
        {paths.map((p, i) => <PathCard key={p.slug} p={p} stats={stats[i]} locale={locale} t={t.paths} />)}
      </div>

      <div id="search" className="mt-16 max-w-2xl">
        <ConceptSearch locale={locale} items={all} placeholder={t.nav.search} />
      </div>
    </div>
  );
}
