import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { FEEDBACK_EMAIL, ICP_NUMBER, VERSION } from "@/content/site";

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <footer className="hairline mt-24">
      <div className="container py-10 flex flex-col md:flex-row gap-4 md:items-center justify-between text-sm text-muted">
        <div>
          <span className="display text-ink">Leo<span className="text-leo">Math</span></span>
          <span className="mx-2">·</span>
          <span>{t.footer.built(VERSION)}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span>{t.footer.license}</span>
          <a href={`mailto:${FEEDBACK_EMAIL}`} className="hover:text-ink">
            {t.footer.feedback} · <span className="mono">{FEEDBACK_EMAIL}</span>
          </a>
          <Link href={`/${locale}/about`} className="hover:text-ink">
            {t.nav.about}
          </Link>
          <Link href={`/${locale}/privacy`} className="hover:text-ink">
            {t.footer.privacy}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-ink">
            {t.footer.terms}
          </Link>
          {ICP_NUMBER && (
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {ICP_NUMBER}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
