"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ExerciseView } from "@/lib/exercise-view";
import { ExerciseCard } from "./ExerciseCard";

/** A concept's exercises, with a running count and a moment of completion when the last one is solved. */
export function ExerciseSet({ exercises, locale, t, summary, next }: {
  exercises: ExerciseView[];
  locale: Locale;
  t: Dictionary["problems"];
  summary: Record<string, { attempts: number; solved: boolean }>;
  next?: { href: string; title: string };
}) {
  const [solved, setSolved] = useState(() => new Set(exercises.filter((e) => summary[e.id]?.solved).map((e) => e.id)));
  const onSolved = useCallback((id: string) => setSolved((s) => (s.has(id) ? s : new Set(s).add(id))), []);
  const done = solved.size;
  const all = done === exercises.length;

  return (
    <div>
      <p className={`text-sm ${all ? "text-e2" : "text-muted"}`}>{t.keepGoing.replace("{d}", String(done)).replace("{n}", String(exercises.length))}</p>
      <div className="mt-4 space-y-6">
        {exercises.map((e, i) => (
          <ExerciseCard key={e.id} exercise={e} index={i + 1} locale={locale} t={t} summary={summary[e.id]} onSolved={onSolved} />
        ))}
      </div>
      {/* The live region exists from the start, so screen readers announce the moment it fills. */}
      <div role="status" aria-live="polite">
      {all && (
        <div className="exercise-correct mt-8 border border-e2/50 bg-e2/10 rounded-[4px] px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="display text-lg text-e2 font-semibold">✓ {t.allDone}</p>
          {next && (
            <Link href={next.href} className="btn btn-primary btn-small ml-auto">{t.allDoneNext.replace("{title}", next.title)}</Link>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
