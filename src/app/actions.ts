"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createUser, currentUser, endSession, startSession, verifyUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { recordAttempt, setProgress, type ProgressStatus } from "@/lib/progress";
import { checkAnswer, getExercise } from "@/content/exercises";
import { getConcept } from "@/content/graph";

export interface FormState {
  error?: string;
  /** Echoed back so the form can keep the email after a failed attempt. */
  email?: string;
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10).max(200),
  displayName: z.string().trim().max(60).optional(),
});

function localeFrom(form: FormData): Locale {
  const l = form.get("locale");
  return typeof l === "string" && isLocale(l) ? l : "zh";
}

function safeNext(form: FormData, locale: Locale): string {
  const next = form.get("next");
  if (typeof next === "string" && next.startsWith(`/${locale}/`) && !next.startsWith("//")) return next;
  return `/${locale}/account`;
}

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeFrom(form);
  const t = getDictionary(locale).auth.errors;
  if (!hasDatabase()) return { error: t.generic };
  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    displayName: form.get("displayName") || undefined,
  });
  const echo = String(form.get("email") ?? "");
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.path[0] === "email" ? t.invalidEmail : t.shortPassword, email: echo };
  }
  try {
    const user = await createUser(parsed.data.email, parsed.data.password, parsed.data.displayName || null, locale);
    await startSession(user.id);
  } catch (err) {
    const code = (err as { code?: string }).code;
    return { error: code === "23505" ? t.emailTaken : t.generic, email: echo };
  }
  redirect(safeNext(form, locale));
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeFrom(form);
  const t = getDictionary(locale).auth.errors;
  if (!hasDatabase()) return { error: t.generic };
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: t.badCredentials, email };
  try {
    const user = await verifyUser(email, password);
    if (!user) return { error: t.badCredentials, email };
    await startSession(user.id);
  } catch {
    return { error: t.generic, email };
  }
  redirect(safeNext(form, locale));
}

export async function logoutAction(form: FormData): Promise<void> {
  const locale = localeFrom(form);
  await endSession();
  redirect(`/${locale}`);
}

export async function setProgressAction(form: FormData): Promise<void> {
  const user = await currentUser();
  const slug = String(form.get("slug") ?? "");
  const status = String(form.get("status") ?? "") as ProgressStatus;
  const locale = localeFrom(form);
  if (!user || !getConcept(slug) || !["none", "learning", "done"].includes(status)) return;
  await setProgress(user.id, slug, status);
  redirect(`/${locale}/concepts/${slug}`);
}

export interface AnswerState {
  checked: boolean;
  correct: boolean;
  answer: string;
}

export async function checkAnswerAction(_prev: AnswerState, form: FormData): Promise<AnswerState> {
  const id = String(form.get("exercise") ?? "");
  const answer = String(form.get("answer") ?? "").trim();
  const exercise = getExercise(id);
  if (!exercise || !answer) return { checked: false, correct: false, answer };
  const correct = checkAnswer(exercise, answer);
  const user = await currentUser();
  if (user) {
    await recordAttempt(user.id, id, answer, correct).catch(() => undefined);
  }
  return { checked: true, correct, answer };
}
