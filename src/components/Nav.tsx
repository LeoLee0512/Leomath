import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { User } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitch } from "./LocaleSwitch";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

export function Nav({ locale, t, user }: { locale: Locale; t: Dictionary; user: User | null }) {
  const items = [
    { href: `/${locale}/learn`, label: t.nav.learn },
    { href: `/${locale}/explore`, label: t.nav.explore },
    { href: `/${locale}/problems`, label: t.nav.problems },
    { href: `/${locale}/tools`, label: t.nav.tools },
    { href: `/${locale}/software`, label: t.nav.software },
    { href: `/${locale}/about`, label: t.nav.about },
  ];
  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-rule">
      <div className="container relative flex h-14 items-center gap-6">
        <Link href={`/${locale}`} className="display text-lg font-semibold tracking-tight">
          Leo<span className="text-leo">Math</span>
        </Link>
        <NavLinks items={items} label={t.nav.menu} />
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={`/${locale}/learn#search`}
            aria-label={t.nav.search}
            title={t.nav.search}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:text-ink hover:bg-paper-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5 L14 14" />
            </svg>
          </Link>
          <ThemeToggle label={t.nav.theme} />
          <LocaleSwitch locale={locale} label={t.nav.language} />
          {user ? (
            <Link href={`/${locale}/account`} className="text-sm text-ink-2 hover:text-ink px-2 py-1 whitespace-nowrap">
              {t.nav.account}
            </Link>
          ) : (
            <Link href={`/${locale}/login`} className="text-sm text-ink-2 hover:text-ink px-2 py-1 whitespace-nowrap">
              {t.nav.login}
            </Link>
          )}
          <MobileMenu items={items} label={t.nav.menu} />
        </div>
      </div>
    </header>
  );
}
