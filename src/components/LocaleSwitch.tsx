"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLocale, switchLocalePath, type Locale } from "@/i18n/config";

export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || "/";
  const target = otherLocale(locale);
  return (
    <Link
      href={switchLocalePath(pathname, target)}
      hrefLang={target}
      className="text-sm text-ink-2 hover:text-ink px-2 py-1 rounded whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
