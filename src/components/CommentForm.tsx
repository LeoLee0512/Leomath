"use client";

import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { addCommentAction, type CommentState } from "@/app/actions";

export function CommentForm({ type, slug, path, locale, t, maxLength }: {
  type: "concept" | "experiment" | "software";
  slug: string;
  path: string;
  locale: Locale;
  t: Dictionary["comments"];
  maxLength: number;
}) {
  const [state, action, pending] = useActionState<CommentState, FormData>(addCommentAction, { posted: 0 });
  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="path" value={path} />
      {/* Remounting the textarea after a successful post clears it without controlled state. */}
      <textarea
        key={state.posted}
        name="body"
        required
        maxLength={maxLength}
        rows={4}
        placeholder={t.placeholder}
        className="field w-full resize-y leading-relaxed"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <button className="btn btn-primary btn-small" disabled={pending}>{pending ? t.posting : t.submit}</button>
        <span className="text-muted">{t.hint}</span>
        {state.error && <span className="text-e1">{state.error}</span>}
      </div>
    </form>
  );
}
