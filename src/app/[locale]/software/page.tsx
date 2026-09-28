import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { software } from "@/content/software";

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
      <div className="mt-12 max-w-2xl space-y-6">
        {software.map((s) => (
          <div key={s.slug} className="border border-rule p-7">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="display text-2xl font-semibold">{s.name}</h2>
              {s.latest && <span className="mono text-xs text-muted">{s.latest.platforms.join(" · ")}</span>}
              {s.latest && <span className="mono text-xs text-muted">v{s.latest.version}</span>}
              {s.status === "coming-soon" ? (
                <span className="text-xs text-accent-2 border border-accent-2/40 rounded-[3px] px-1.5 py-0.5">{t.software.statusComing}{s.upcomingVersion ? ` · v${s.upcomingVersion}` : ""}</span>
              ) : (
                <span className="text-xs text-muted">{s.status === "preview" ? t.software.statusPreview : t.software.statusStable}</span>
              )}
            </div>
            <p className="mt-2 text-ink-2">{s.tagline[locale]}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${locale}/software/${s.slug}`} className="btn btn-ghost btn-small">{t.software.learn} →</Link>
              {s.latest && <a href={s.latest.downloadUrl} className="btn btn-primary btn-small" rel="noopener">{t.software.download} ↓</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
