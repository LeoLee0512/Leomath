"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createUser, currentUser, endSession, startSession, verifyUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { recordAttempt, setProgress, type ProgressStatus } from "@/lib/progress";
import { addComment, deleteComment, isAdmin, postedRecently, COMMENT_MAX_LENGTH, type CommentTarget } from "@/lib/comments";
import { normaliseBody } from "@/lib/comments-format";
import { checkAnswer, diagnose, getExercise, type Diagnosis } from "@/content/exercises";
import { getConcept, getExperiment } from "@/content/graph";
import { getSoftware } from "@/content/software";
import { deleteAccount, passwordMatches } from "@/lib/account";
import { richHtml } from "@/lib/rich";
import { clear, clientIp, isLimited, record, FIFTEEN_MINUTES, ONE_HOUR } from "@/lib/rate-limit";

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
  const ipKey = `register:${await clientIp()}`;
  if (isLimited(ipKey, 10)) return { error: t.tooMany, email: echo };
  record(ipKey, ONE_HOUR);
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
  const ipKey = `login-ip:${await clientIp()}`;
  const accountKey = `login-account:${email.trim().toLowerCase()}`;
  if (isLimited(ipKey, 20) || isLimited(accountKey, 5)) return { error: t.tooMany, email };
  try {
    const user = await verifyUser(email, password);
    if (!user) {
      record(ipKey, FIFTEEN_MINUTES);
      record(accountKey, FIFTEEN_MINUTES);
      return { error: t.badCredentials, email };
    }
    clear(accountKey);
    await startSession(user.id);
  } catch {
    return { error: t.generic, email };
  }
  redirect(safeNext(form, locale));
}

/** Self-service account deletion: the password confirms it is really the owner, then everything is deleted. */
export async function deleteAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeFrom(form);
  const t = getDictionary(locale).auth.data;
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login`);
  if (form.get("confirm") !== "yes") return { error: t.needConfirm };
  const password = String(form.get("password") ?? "");
  const key = `delete:${user.id}`;
  if (isLimited(key, 5)) return { error: getDictionary(locale).auth.errors.tooMany };
  try {
    if (!(await passwordMatches(user.id, password))) {
      record(key, FIFTEEN_MINUTES);
      return { error: t.wrongPassword };
    }
    await deleteAccount(user.id);
  } catch {
    return { error: getDictionary(locale).auth.errors.generic };
  }
  await endSession();
  redirect(`/${locale}/account/deleted`);
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
  /** Coach-style note (server-rendered HTML): why this answer is wrong, or why the chosen option is right. */
  feedback?: string;
}

function feedbackText(d: Diagnosis | null, locale: Locale): string | undefined {
  if (!d) return undefined;
  const t = getDictionary(locale).diagnosis;
  switch (d.kind) {
    case "note": return d.note[locale];
    case "unreadable": return t.unreadable;
    case "sign": return t.sign;
    case "reciprocal": return t.reciprocal;
    case "scale": return t.scale(d.factor);
    case "near": return t.near(String(d.tolerance));
  }
}

/** A hint or solution as HTML, fetched when the reader opens it. */
export async function exerciseTextAction(id: string, part: "hint" | "solution", locale: string): Promise<string> {
  const exercise = getExercise(id);
  if (!exercise || (part !== "hint" && part !== "solution")) return "";
  return richHtml(exercise[part][isLocale(locale) ? locale : "zh"]);
}

export async function checkAnswerAction(_prev: AnswerState, form: FormData): Promise<AnswerState> {
  const id = String(form.get("exercise") ?? "");
  const answer = String(form.get("answer") ?? "").trim();
  const exercise = getExercise(id);
  if (!exercise || !answer) return { checked: false, correct: false, answer };
  const correct = checkAnswer(exercise, answer);
  const note = feedbackText(diagnose(exercise, answer), localeFrom(form));
  const feedback = note ? richHtml(note) : undefined;
  const user = await currentUser();
  if (user) {
    await recordAttempt(user.id, id, answer, correct).catch(() => undefined);
  }
  return { checked: true, correct, answer, feedback };
}

// ---- Comments -------------------------------------------------------------

export interface CommentState {
  error?: string;
  /** Incremented after each successful post so the form can reset its textarea. */
  posted: number;
}

const commentInput = z.object({
  type: z.enum(["concept", "experiment", "software"]),
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  body: z.string().transform(normaliseBody).pipe(z.string().min(1).max(COMMENT_MAX_LENGTH)),
});

function targetExists(type: CommentTarget["type"], slug: string): boolean {
  if (type === "concept") return getConcept(slug)?.status === "published";
  if (type === "experiment") return Boolean(getExperiment(slug));
  return Boolean(getSoftware(slug));
}

function pagePath(form: FormData, locale: Locale): string | null {
  const p = form.get("path");
  return typeof p === "string" && p.startsWith(`/${locale}/`) && !p.startsWith("//") ? p : null;
}

export async function addCommentAction(prev: CommentState, form: FormData): Promise<CommentState> {
  const locale = localeFrom(form);
  const t = getDictionary(locale).comments.errors;
  const user = await currentUser();
  if (!user) return { ...prev, error: t.loginRequired };
  if (!hasDatabase()) return { ...prev, error: t.generic };
  const parsed = commentInput.safeParse({ type: form.get("type"), slug: form.get("slug"), body: form.get("body") ?? "" });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path[0] === "body") return { ...prev, error: issue.code === "too_big" ? t.tooLong : t.empty };
    return { ...prev, error: t.generic };
  }
  const { type, slug, body } = parsed.data;
  if (!targetExists(type, slug)) return { ...prev, error: t.generic };
  try {
    if (await postedRecently(user.id)) return { ...prev, error: t.tooFast };
    await addComment(user.id, { type, slug }, body);
  } catch {
    return { ...prev, error: t.generic };
  }
  const path = pagePath(form, locale);
  if (path) revalidatePath(path);
  return { posted: prev.posted + 1 };
}

export async function deleteCommentAction(form: FormData): Promise<void> {
  const locale = localeFrom(form);
  const user = await currentUser();
  const id = String(form.get("id") ?? "");
  if (!user || !/^\d{1,18}$/.test(id) || !hasDatabase()) return;
  await deleteComment(id, user.id, isAdmin(user)).catch(() => undefined);
  const path = pagePath(form, locale);
  if (path) revalidatePath(path);
}
