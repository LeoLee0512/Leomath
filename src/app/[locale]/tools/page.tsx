import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { FormulaEditor } from "@/components/tools/FormulaEditor";
import { Plotter } from "@/components/tools/Plotter";
import { MatrixTool } from "@/components/tools/MatrixTool";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).tools.title : "Tools" };
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.tools.title}</h1>
      <p className="mt-3 text-ink-2 max-w-2xl">{t.tools.subtitle}</p>
      <nav className="mt-6 flex flex-wrap gap-4 text-sm">
        <a href="#formula" className="text-leo hover:underline">{t.tools.formula}</a>
        <a href="#plot" className="text-leo hover:underline">{t.tools.plot}</a>
        <a href="#matrix" className="text-leo hover:underline">{t.tools.matrix}</a>
      </nav>
      <div className="mt-10 space-y-10">
        <FormulaEditor locale={locale} />
        <Plotter locale={locale} />
        <MatrixTool locale={locale} />
      </div>
      <p className="mt-10 text-sm text-muted">
        {t.tools.related}: <Link href={`/${locale}/concepts/matrices`} className="text-leo hover:underline">{t.tools.relatedMatrices}</Link> · <Link href={`/${locale}/concepts/eigenvalues`} className="text-leo hover:underline">{t.tools.relatedEigen}</Link>
      </p>
    </div>
  );
}
