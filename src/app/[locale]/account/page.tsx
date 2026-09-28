import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { currentUser } from "@/lib/auth";
import { getExerciseSummary, getProgress } from "@/lib/progress";
import { getConcept, paths } from "@/content/graph";
import { getExercise } from "@/content/exercises";
import { logoutAction } from "@/app/actions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDictionary(locale).auth.accountTitle : "Account" };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login`);
  const progress = await getProgress(user.id).catch(() => ({}));
  const summary = await getExerciseSummary(user.id).catch(() => ({}));
  const solved = Object.entries(summary).filter(([, s]) => s.solved).map(([id]) => getExercise(id)).filter(Boolean);
  const hasAny = Object.keys(progress).length > 0 || solved.length > 0;

  return (
    <div className="container py-14 max-w-3xl">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="display text-4xl font-semibold">{t.auth.accountTitle}</h1>
          <p className="mt-2 text-muted text-sm">{user.displayName ?? user.email}</p>
        </div>
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button className="btn btn-ghost btn-small">{t.nav.logout}</button>
        </form>
      </div>

      {!hasAny && <p className="mt-10 text-ink-2">{t.auth.empty} <Link href={`/${locale}/learn`} className="text-leo hover:underline">{t.nav.learn} →</Link></p>}

      <section className="mt-12">
        <h2 className="eyebrow mb-4">{t.auth.progressTitle}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {paths.map((p) => (
            <div key={p.slug} className="border-t border-ink-2 pt-4">
              <h3 className="display text-lg font-semibold"><Link href={`/${locale}/learn/${p.slug}`} className="hover:text-leo">{p.title[locale]}</Link></h3>
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.concepts.map((slug) => {
                  const st = (progress as Record<string, "learning" | "done">)[slug] ?? "none";
                  return (
                    <li key={slug} className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${st === "done" ? "bg-e2" : st === "learning" ? "bg-leo" : "bg-rule-2"}`} />
                      <Link href={`/${locale}/concepts/${slug}`} className="hover:text-leo">{getConcept(slug)!.title[locale]}</Link>
                      <span className="ml-auto text-xs text-muted">{t.learn.status[st]}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="eyebrow mb-4">{t.auth.solvedTitle} · {solved.length}</h2>
        <ul className="text-sm space-y-1">
          {solved.map((e) => e && (
            <li key={e.id}><Link href={`/${locale}/concepts/${e.concept}`} className="hover:text-leo">{getConcept(e.concept)!.title[locale]} · <span className="mono text-muted">{e.id}</span></Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
