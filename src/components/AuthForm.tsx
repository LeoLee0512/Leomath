"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { loginAction, registerAction, type FormState } from "@/app/actions";

export function AuthForm({ mode, locale, t, next }: { mode: "login" | "register"; locale: Locale; t: Dictionary["auth"]; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? loginAction : registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block text-sm">
        <span className="text-ink-2">{t.email}</span>
        <input name="email" type="email" required autoComplete="email" className="field mt-1" defaultValue={state.email ?? ""} />
      </label>
      <label className="block text-sm">
        <span className="text-ink-2">{t.password}</span>
        <input name="password" type="password" required minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} className="field mt-1" />
        {mode === "register" && <span className="block text-xs text-muted mt-1">{t.passwordHint}</span>}
      </label>
      {mode === "register" && (
        <label className="block text-sm">
          <span className="text-ink-2">{t.displayName}</span>
          <input name="displayName" type="text" maxLength={60} className="field mt-1" />
        </label>
      )}
      {state.error && <p className="text-sm text-e1" role="alert">{state.error}</p>}
      {mode === "register" && (
        <p className="text-xs text-muted">
          {t.agree[0]}
          <Link href={`/${locale}/terms`} className="text-leo hover:underline">{t.agree[1]}</Link>
          {t.agree[2]}
          <Link href={`/${locale}/privacy`} className="text-leo hover:underline">{t.agree[3]}</Link>
          {t.agree[4]}
        </p>
      )}
      <button className="btn btn-primary w-full justify-center" disabled={pending}>
        {mode === "login" ? t.submitLogin : t.submitRegister}
      </button>
      <p className="text-sm text-muted text-center">
        {mode === "login" ? t.noAccount : t.haveAccount}{" "}
        <Link href={`/${locale}/${mode === "login" ? "register" : "login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-leo hover:underline">
          {mode === "login" ? t.goRegister : t.goLogin}
        </Link>
      </p>
    </form>
  );
}
