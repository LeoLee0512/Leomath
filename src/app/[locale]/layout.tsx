import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { currentUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { themeInitScript } from "@/components/ThemeToggle";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

// Pages show per-user progress, so they are rendered on each request.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "zh";
  const t = getDictionary(l);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} — ${t.tagline}`, template: `%s · ${SITE_NAME}` },
    description: t.home.heroSubtitle,
    applicationName: SITE_NAME,
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const user = await currentUser();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">{t.nav.skip}</a>
        <Nav locale={locale} t={t} user={user} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <Footer locale={locale} t={t} />
      </body>
    </html>
  );
}
