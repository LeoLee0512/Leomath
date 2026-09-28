import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { User } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitch } from "./LocaleSwitch";

export function Nav({ locale, t, user }: { locale: Locale; t: Dictionary; user: User | null }) {
  const items = [
    { href: `/${locale}/learn`, label: t.nav.learn },
    { href: `/${locale}/explore`, label: t.nav.explore },
    { href: `/${locale}/problems`, label: t.nav.problems },
    { href: `/${locale}/software`, label: t.nav.software },
    { href: `/${locale}/about`, label: t.nav.about },
  ];
  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-rule">
      <div className="container flex h-14 items-center gap-6">
        <Link href={`/${locale}`} className="display text-lg font-semibold tracking-tight">
          Leo<span className="text-leo">Math</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-ink-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
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
            <Link href={`/${locale}/account`} className="text-sm text-ink-2 hover:text-ink px-2 py-1">
              {t.nav.account}
            </Link>
          ) : (
            <Link href={`/${locale}/login`} className="text-sm text-ink-2 hover:text-ink px-2 py-1">
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
      <nav className="md:hidden container flex gap-4 overflow-x-auto pb-2 text-sm text-ink-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-ink">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
