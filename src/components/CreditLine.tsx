import type { Locale } from "@/i18n/config";
import type { Credit } from "@/content/graph";

/** “Idea from …” lines: the note, then the public source as a bare link. */
export function CreditLine({ credits, locale, className = "" }: { credits?: Credit[]; locale: Locale; className?: string }) {
  if (!credits?.length) return null;
  return (
    <div className={`credit-line ${className}`}>
      {credits.map((c) => (
        <p key={c.url}>
          {c.note[locale]}{locale === "zh" ? "：" : ": "}
          <a href={c.url} target="_blank" rel="noopener noreferrer">{c.url.replace(/^https?:\/\//, "")}</a>
        </p>
      ))}
    </div>
  );
}
