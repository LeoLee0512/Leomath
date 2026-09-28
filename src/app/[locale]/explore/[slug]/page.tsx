import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { experiments, getExperiment, getConcept, concepts } from "@/content/graph";
import { ExperimentEmbed } from "@/components/experiments/ExperimentEmbed";

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const e = getExperiment(slug);
  return e && isLocale(locale) ? { title: e.title[locale], description: e.summary[locale] } : {};
}

export default async function ExperimentPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const e = getExperiment(slug);
  if (!e) notFound();
  const t = getDictionary(locale);
  const main = getConcept(e.concept)!;
  const related = concepts.filter((c) => c.experiments.includes(slug) && c.status === "published");
  return (
    <div className="container py-12">
      <p className="eyebrow"><Link href={`/${locale}/explore`} className="hover:text-ink">{t.explore.title}</Link></p>
      <h1 className="display text-4xl font-semibold mt-3">{e.title[locale]}</h1>
      <p className="mt-3 text-ink-2 max-w-2xl">{e.summary[locale]}</p>
      <div className="mt-10">
        <ExperimentEmbed slug={slug} locale={locale} />
      </div>
      <div className="mt-8 text-sm">
        <span className="text-muted">{t.explore.relatedConcept}: </span>
        {(related.length ? related : [main]).map((c, i) => (
          <span key={c.slug}>
            {i > 0 && <span className="text-muted"> · </span>}
            <Link href={`/${locale}/concepts/${c.slug}`} className="text-leo hover:underline">{c.title[locale]}</Link>
          </span>
        ))}
      </div>
    </div>
  );
}
