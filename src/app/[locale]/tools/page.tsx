import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { FormulaEditor } from "@/components/tools/FormulaEditor";
import { Plotter } from "@/components/tools/Plotter";
import { MatrixTool } from "@/components/tools/MatrixTool";
import { concepts, type Tool } from "@/content/graph";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).tools.title : "Tools" };
}

function Related({ id, locale, label }: { id: Tool["id"]; locale: "zh" | "en"; label: string }) {
  const list = concepts.filter((c) => c.status === "published" && c.tools?.includes(id));
  if (list.length === 0) return null;
  return (
    <p className="mt-3 text-sm text-muted">
      {label}:{" "}
      {list.map((c, i) => (
        <span key={c.slug}>{i > 0 && " · "}<Link href={`/${locale}/concepts/${c.slug}`} className="text-leo hover:underline">{c.title[locale]}</Link></span>
      ))}
    </p>
  );
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
        <div><FormulaEditor locale={locale} /><Related id="formula" locale={locale} label={t.tools.related} /></div>
        <div><Plotter locale={locale} /><Related id="plot" locale={locale} label={t.tools.related} /></div>
        <div><MatrixTool locale={locale} /><Related id="matrix" locale={locale} label={t.tools.related} /></div>
      </div>
    </div>
  );
}
