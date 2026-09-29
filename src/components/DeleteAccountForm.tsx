"use client";

import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { deleteAccountAction, type FormState } from "@/app/actions";

/** The deletion form, folded away until opened so it cannot be triggered by a stray click. */
export function DeleteAccountForm({ locale, t }: { locale: Locale; t: Dictionary["auth"]["data"] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccountAction, {});
  return (
    <details className="border border-e1/40 rounded-[4px]">
      <summary className="cursor-pointer select-none px-4 py-3 text-e1 font-medium">{t.deleteTitle}</summary>
      <form action={action} className="px-4 pb-4 space-y-4 text-sm">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <p className="text-ink-2">{t.deleteDesc}</p>
          <ul className="mt-2 list-disc pl-5 text-ink-2 space-y-0.5">
            {t.deleteList.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-2 text-muted">{t.deleteHint}</p>
        </div>
        <label className="block">
          <span className="text-ink-2">{t.password}</span>
          <input name="password" type="password" required autoComplete="current-password" className="field mt-1" />
        </label>
        <label className="flex items-center gap-2">
          <input name="confirm" type="checkbox" value="yes" required />
          <span>{t.confirm}</span>
        </label>
        {state.error && <p className="text-e1" role="alert">{state.error}</p>}
        <button className="btn btn-small border-e1 text-e1 hover:bg-e1 hover:text-paper" disabled={pending}>{t.deleteButton}</button>
      </form>
    </details>
  );
}
