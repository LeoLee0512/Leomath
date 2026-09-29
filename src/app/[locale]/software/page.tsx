import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { software } from "@/content/software";
import { SoftwareCard } from "@/components/SoftwareCard";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/software", { title: t.nav.software, description: t.software.subtitle });
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
        {software.filter((s) => s.status !== "coming-soon").map((s) => (
          <SoftwareCard key={s.slug} s={s} locale={locale} t={t.software} learnLabel={`${t.software.learn} →`} />
        ))}
      </div>
      {/* Not usable yet: listed, but without the weight of a product card. */}
      {software.some((s) => s.status === "coming-soon") && (
        <section className="mt-12 max-w-4xl">
          <h2 className="eyebrow mb-3">{t.software.upcoming}</h2>
          <ul className="divide-y divide-rule border-y border-rule">
            {software.filter((s) => s.status === "coming-soon").map((s) => (
              <li key={s.slug} className="py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <Link href={`/${locale}/software/${s.slug}`} className="font-medium text-ink-2 hover:text-leo">{s.name}</Link>
                <span className="text-muted">{s.tagline[locale]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
