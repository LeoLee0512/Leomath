import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { currentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/register", { title: t.auth.registerTitle, description: t.tagline, noindex: true });
}

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  const t = getDictionary(locale);
  if (await currentUser()) redirect(`/${locale}/account`);
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="display text-3xl font-semibold mb-8">{t.auth.registerTitle}</h1>
        <ul className="mb-8 -mt-4 space-y-1.5 text-sm text-ink-2">
          {t.paths.loginBullets.map((b) => (
            <li key={b} className="flex gap-2"><span className="text-e2" aria-hidden="true">✓</span>{b}</li>
          ))}
          <li className="pt-1 text-xs text-muted">{t.paths.loginNote}</li>
        </ul>
        <AuthForm mode="register" locale={locale} t={t.auth} next={next} />
      </div>
    </div>
  );
}
