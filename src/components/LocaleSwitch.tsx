"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { otherLocale, switchLocalePath, type Locale } from "@/i18n/config";

export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || "/";
  const target = otherLocale(locale);
  const href = switchLocalePath(pathname, target);
  const router = useRouter();
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target === "zh" ? "zh-CN" : "en"}
      // Keep the query and anchor (e.g. an experiment's settings) when switching language.
      onClick={(e) => {
        const extra = window.location.search + window.location.hash;
        if (!extra || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        router.push(href + extra);
      }}
      className="text-sm text-ink-2 hover:text-ink px-2 py-1 rounded whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
