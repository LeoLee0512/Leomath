import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <footer className="hairline mt-24">
      <div className="container py-10 flex flex-col md:flex-row gap-4 md:items-center justify-between text-sm text-muted">
        <div>
          <span className="display text-ink">Leo<span className="text-leo">Math</span></span>
          <span className="mx-2">·</span>
          <span>{t.footer.built}</span>
        </div>
        <div className="flex gap-5">
          <span>{t.footer.license}</span>
          <a href="https://github.com/LeoLee0512/Leomath" className="hover:text-ink" rel="noopener">
            {t.footer.source}
          </a>
          <Link href={`/${locale}/about`} className="hover:text-ink">
            {t.nav.about}
          </Link>
        </div>
      </div>
    </footer>
  );
}
