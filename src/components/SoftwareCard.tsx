import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Software } from "@/content/software";

export function statusLabel(s: Software, t: Dictionary["software"]): string {
  switch (s.status) {
    case "coming-soon": return t.statusComing;
    case "beta": return t.statusBeta;
    case "preview": return t.statusPreview;
    default: return t.statusStable;
  }
}

/** Compact product card used on the home page and the software index. */
export function SoftwareCard({ s, locale, t, learnLabel }: { s: Software; locale: Locale; t: Dictionary["software"]; learnLabel: string }) {
  const version = s.latest?.version ?? s.version;
  return (
    <div className="border border-rule p-6 md:p-7 bg-paper flex flex-col">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="display text-2xl font-semibold">{s.name}</h3>
        {version && <span className="mono text-xs text-muted">v{version}</span>}
        <span className={`text-xs rounded-[3px] px-1.5 py-0.5 border ${s.status === "coming-soon" || s.status === "beta" ? "text-accent-2 border-accent-2/40" : "text-muted border-rule-2"}`}>
          {statusLabel(s, t)}
        </span>
        <span className="text-xs text-muted">{s.kind === "web" ? t.web : t.desktop}{s.repoUrl ? ` · ${t.openSource}` : ""}</span>
      </div>
      <p className="mt-2 text-ink-2 flex-1">{s.tagline[locale]}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/${locale}/software/${s.slug}`} className="btn btn-ghost btn-small">{learnLabel}</Link>
        {s.kind === "web" && s.useUrl && <a href={s.useUrl} className="btn btn-primary btn-small" rel="noopener">{t.open}</a>}
        {s.latest && <a href={s.latest.downloadUrl} className="btn btn-primary btn-small" rel="noopener">{t.download} ↓</a>}
      </div>
    </div>
  );
}
