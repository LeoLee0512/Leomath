"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { ExperimentUrlContext, clearExperimentUrl, flushExperimentUrl } from "./urlState";

const copy = {
  zh: { reset: "重置", share: "复制链接", copied: "已复制，链接会打开同样的参数", back: "回到正文 →" },
  en: { reset: "Reset", share: "Copy link", copied: "Copied: the link opens these exact settings", back: "Back to the article →" },
};

/**
 * Wraps one experiment: provides its URL parameters, and a toolbar to reset it,
 * copy a link to its current settings, and (on the standalone page) return to the article.
 */
export function ExperimentShell({ slug, locale, query, backHref, children, after }: {
  slug: string;
  locale: Locale;
  query: Record<string, string>;
  backHref?: string;
  children: ReactNode;
  /** Rendered below the toolbar (credits, observation questions). */
  after?: ReactNode;
}) {
  const t = copy[locale];
  const [version, setVersion] = useState(0);
  const [current, setCurrent] = useState(query);
  const [copied, setCopied] = useState(false);
  const ctx = useMemo(() => ({ slug, query: current }), [slug, current]);

  function reset() {
    clearExperimentUrl(slug);
    setCurrent({});
    // A new key remounts the experiment, so every control returns to its default.
    setVersion((v) => v + 1);
  }

  async function share() {
    // Write pending changes synchronously: waiting would make Safari treat the copy as not user-initiated.
    flushExperimentUrl();
    const url = new URL(window.location.href);
    url.hash = `exp-${slug}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t.share, url.toString());
    }
  }

  return (
    <div id={`exp-${slug}`} className="scroll-mt-24">
      <ExperimentUrlContext.Provider value={ctx}>
        <div key={version}>{children}</div>
      </ExperimentUrlContext.Provider>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 exp-control text-sm">
        <button type="button" onClick={reset} className="text-muted hover:text-ink"><span aria-hidden="true">↺ </span>{t.reset}</button>
        <button type="button" onClick={share} className="text-muted hover:text-ink"><span aria-hidden="true">⧉ </span>{t.share}</button>
        <span role="status" aria-live="polite" className="text-e2 text-xs">{copied ? t.copied : ""}</span>
        {backHref && <a href={backHref} className="ml-auto text-leo hover:underline">{t.back}</a>}
      </div>
      {after}
    </div>
  );
}
