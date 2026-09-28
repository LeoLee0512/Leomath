import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { software, getSoftware } from "@/content/software";

export function generateStaticParams() {
  return software.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = getSoftware(slug);
  return s && isLocale(locale) ? { title: s.name, description: s.tagline[locale] } : {};
}

export default async function SoftwareDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const s = getSoftware(slug);
  if (!s) notFound();
  const t = getDictionary(locale);
  return (
    <div className="container py-14 max-w-3xl">
      <p className="eyebrow"><Link href={`/${locale}/software`} className="hover:text-ink">{t.nav.software}</Link></p>
      <h1 className="display text-4xl font-semibold mt-3">{s.name}</h1>
      <p className="mt-3 text-lg text-ink-2">{s.tagline[locale]}</p>
      <p className="mt-8 leading-relaxed prose-math">{s.description[locale]}</p>
      {s.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.screenshot} alt={`${s.name} screenshot`} className="mt-8 w-full border border-rule rounded" />
      )}
      <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm border-t border-rule pt-6">
        <dt className="text-muted">{t.software.version}</dt><dd className="mono">v{s.latest.version}</dd>
        <dt className="text-muted">{t.software.released}</dt><dd className="mono">{s.latest.date}</dd>
        <dt className="text-muted">{t.software.platform}</dt><dd>{s.latest.platforms.join(", ")}</dd>
        <dt className="text-muted">{t.software.status}</dt><dd>{s.status === "preview" ? t.software.statusPreview : t.software.statusStable}{!s.repoUrl && ` · ${t.software.closedSource}`}</dd>
        {s.latest.sha256 && (<><dt className="text-muted">{t.software.checksum}</dt><dd className="mono break-all text-xs">{s.latest.sha256}</dd></>)}
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={s.latest.downloadUrl} className="btn btn-primary" rel="noopener">{t.software.download} ↓</a>
        <a href={s.releasesUrl} className="btn btn-ghost" rel="noopener">{t.software.releases}</a>
        {s.repoUrl && <a href={s.repoUrl} className="btn btn-ghost" rel="noopener">GitHub</a>}
      </div>
    </div>
  );
}
