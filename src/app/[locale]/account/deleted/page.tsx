import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale).auth.data;
  return pageMeta(locale, "/account/deleted", { title: t.deletedTitle, description: t.deletedBody, noindex: true });
}

export default async function AccountDeletedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).auth.data;
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-md">
        <h1 className="display text-3xl font-semibold">{t.deletedTitle}</h1>
        <p className="mt-4 text-ink-2 leading-relaxed">{t.deletedBody}</p>
        <Link href={`/${locale}`} className="btn btn-primary btn-small mt-8 inline-flex">{t.backHome}</Link>
      </div>
    </div>
  );
}
