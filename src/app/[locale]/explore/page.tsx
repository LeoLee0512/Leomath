import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { experiments, getConcept } from "@/content/graph";
import { M } from "@/components/Math";

const formulas: Record<string, string> = {
  "linear-transform": "A\\mathbf e_1,\\ A\\mathbf e_2",
  "ode-explorer": "y_{n+1}=y_n+h\\,\\Phi(t_n,y_n)",
  "exponential-derivative": "\\lim_{h\\to0}\\frac{a^h-1}{h}",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).explore.title : "Explore" };
}

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.explore.title}</h1>
      <p className="mt-3 text-ink-2 max-w-2xl">{t.explore.subtitle}</p>
      <div className="mt-12 grid gap-px bg-rule md:grid-cols-3 border border-rule">
        {experiments.map((e) => {
          const c = getConcept(e.concept)!;
          return (
            <Link key={e.slug} href={`/${locale}/explore/${e.slug}`} className="bg-paper p-7 hover:bg-paper-2 transition-colors flex flex-col">
              <div className="text-muted text-lg h-8"><M>{formulas[e.slug]}</M></div>
              <h2 className="display text-xl font-semibold mt-3">{e.title[locale]}</h2>
              <p className="mt-2 text-sm text-ink-2 leading-relaxed flex-1">{e.summary[locale]}</p>
              <p className="mt-5 text-xs text-muted">{t.explore.relatedConcept}: {c.title[locale]}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
