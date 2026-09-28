"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Exercise } from "@/content/exercises";
import { checkAnswerAction, type AnswerState } from "@/app/actions";
import { RichText } from "./Math";

const initial: AnswerState = { checked: false, correct: false, answer: "" };

export function ExerciseCard({ exercise, index, locale, t, summary }: {
  exercise: Exercise;
  index: number;
  locale: Locale;
  t: Dictionary["problems"];
  summary?: { attempts: number; solved: boolean };
}) {
  const [state, action, pending] = useActionState(checkAnswerAction, initial);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const solved = state.correct || summary?.solved;

  return (
    <div className="border border-rule p-5 md:p-6 bg-paper">
      <div className="flex items-baseline gap-3">
        <span className="mono text-muted text-sm">{String(index).padStart(2, "0")}</span>
        <div className="prose-math text-base flex-1"><RichText>{exercise.statement[locale]}</RichText></div>
        {solved && <span className="text-xs text-e2 whitespace-nowrap">✓ {t.solved}</span>}
      </div>
      <form action={action} className="mt-4 pl-8">
        <input type="hidden" name="exercise" value={exercise.id} />
        {exercise.kind === "numeric" ? (
          <div className="flex gap-2 max-w-sm">
            <input name="answer" className="field mono" inputMode="decimal" placeholder={t.yourAnswer} defaultValue={state.answer} autoComplete="off" />
            <button className="btn btn-primary btn-small" disabled={pending}>{t.check}</button>
          </div>
        ) : (
          <div className="space-y-2">
            {exercise.options.map((o, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer">
                <input type="radio" name="answer" value={i} defaultChecked={state.answer === String(i)} className="mt-1.5 accent-[var(--leo)]" />
                <span className="prose-math text-base"><RichText>{o[locale]}</RichText></span>
              </label>
            ))}
            <button className="btn btn-primary btn-small mt-1" disabled={pending}>{t.check}</button>
          </div>
        )}
        {state.checked && (
          <p className={`mt-3 text-sm ${state.correct ? "text-e2" : "text-e1"}`}>{state.correct ? t.correct : t.incorrect}</p>
        )}
      </form>
      <div className="mt-4 pl-8 flex gap-4 text-sm">
        <button type="button" className="text-muted hover:text-ink" onClick={() => setShowHint((v) => !v)}>{t.hint}</button>
        <button type="button" className="text-muted hover:text-ink" onClick={() => setShowSolution((v) => !v)}>{t.solution}</button>
        {summary && summary.attempts > 0 && <span className="text-muted ml-auto mono">{summary.attempts} {t.attempts}</span>}
      </div>
      {showHint && <div className="mt-3 pl-8 text-sm text-ink-2 prose-math"><RichText>{exercise.hint[locale]}</RichText></div>}
      {showSolution && <div className="mt-3 pl-8 text-sm text-ink-2 prose-math border-l-2 border-rule-2 pl-4"><RichText>{exercise.solution[locale]}</RichText></div>}
    </div>
  );
}
