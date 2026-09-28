import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { software } from "@/content/software";
import { SoftwareCard } from "@/components/SoftwareCard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).nav.software : "Software" };
}

export default async function SoftwarePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="container py-14">
      <h1 className="display text-4xl font-semibold">{t.software.title}</h1>
      <p className="mt-3 text-ink-2 max-w-2xl">{t.software.subtitle}</p>
      <div className="mt-12 grid gap-4 md:grid-cols-2 max-w-4xl">
        {software.map((s) => (
          <SoftwareCard key={s.slug} s={s} locale={locale} t={t.software} learnLabel={`${t.software.learn} →`} />
        ))}
      </div>
    </div>
  );
}
