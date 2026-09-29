"use client";

import { useActionState, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Exercise } from "@/content/exercises";
import { checkAnswerAction, type AnswerState } from "@/app/actions";
import { RichText } from "./Math";

const initial: AnswerState = { checked: false, correct: false, answer: "" };
/** Tolerances below this mean “exact value” (a fraction is fine); larger ones are stated as ±tolerance. */
const EXACT_TOLERANCE = 1e-5;

export function ExerciseCard({ exercise, index, locale, t, summary, onSolved }: {
  exercise: Exercise;
  index: number;
  locale: Locale;
  t: Dictionary["problems"];
  summary?: { attempts: number; solved: boolean };
  /** Called once when this exercise is answered correctly. */
  onSolved?: (id: string) => void;
}) {
  const [state, action, pending] = useActionState(checkAnswerAction, initial);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  // Once solved, stays solved: a later wrong attempt must not take the tick away (ExerciseSet keeps counting it).
  const [solvedHere, setSolvedHere] = useState(false);
  if (state.correct && !solvedHere) setSolvedHere(true);
  const solved = solvedHere || state.correct || summary?.solved;

  useEffect(() => {
    if (state.correct) onSolved?.(exercise.id);
  }, [state.correct, exercise.id, onSolved]);

  return (
    <div className={`border p-5 md:p-6 bg-paper transition-colors ${solved ? "border-e2/50" : "border-rule"}`}>
      <div className="flex items-baseline gap-3">
        <span className={`mono text-sm ${solved ? "text-e2" : "text-muted"}`}>{solved ? "✓" : String(index).padStart(2, "0")}</span>
        <div className="prose-math text-base flex-1"><RichText>{exercise.statement[locale]}</RichText></div>
        {solved && <span className="text-xs text-e2 whitespace-nowrap">{t.solved}</span>}
      </div>
      <form action={action} className="mt-4 pl-8">
        <input type="hidden" name="exercise" value={exercise.id} />
        <input type="hidden" name="locale" value={locale} />
        {exercise.kind === "numeric" ? (
          <>
            <div className="flex gap-2 max-w-sm">
              <input name="answer" className="field mono" inputMode="decimal" placeholder={t.yourAnswer} aria-label={t.yourAnswer} defaultValue={state.answer} autoComplete="off" />
              <button className="btn btn-primary btn-small" disabled={pending}>{t.check}</button>
            </div>
            {/* The grading rule, stated up front. */}
            <p className="mt-1.5 text-xs text-muted">
              {exercise.tolerance < EXACT_TOLERANCE ? t.exact : t.within.replace("{tol}", String(exercise.tolerance))}
            </p>
          </>
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
        <div aria-live="polite">
          {state.checked && state.correct && (
            <div className="exercise-correct mt-3 border-l-2 border-e2 bg-e2/10 px-3 py-2 text-sm">
              <p className="text-e2 font-medium">✓ {t.correct}</p>
              {state.feedback && <div className="mt-1 text-ink-2 prose-math text-[0.95rem] leading-relaxed"><RichText>{state.feedback}</RichText></div>}
            </div>
          )}
          {state.checked && !state.correct && (
            <div className="mt-3 border-l-2 border-e1 px-3 py-2 text-sm">
              <p className="text-e1">{t.incorrect}</p>
              {state.feedback && <div className="mt-1 text-ink-2 prose-math text-[0.95rem] leading-relaxed"><RichText>{state.feedback}</RichText></div>}
            </div>
          )}
        </div>
      </form>
      <div className="mt-4 pl-8 flex gap-4 text-sm">
        <button type="button" className="text-muted hover:text-ink" aria-expanded={showHint} onClick={() => setShowHint((v) => !v)}>{t.hint}</button>
        <button type="button" className="text-muted hover:text-ink" aria-expanded={showSolution} onClick={() => setShowSolution((v) => !v)}>{t.solution}</button>
        {summary && summary.attempts > 0 && <span className="text-muted ml-auto mono">{summary.attempts} {t.attempts}</span>}
      </div>
      {showHint && <div className="mt-3 pl-8 text-sm text-ink-2 prose-math"><RichText>{exercise.hint[locale]}</RichText></div>}
      {showSolution && <div className="mt-3 pl-8 text-sm text-ink-2 prose-math border-l-2 border-rule-2 pl-4"><RichText>{exercise.solution[locale]}</RichText></div>}
    </div>
  );
}
