/**
 * Everything that changes data. Form actions are posted by plain HTML forms (they work without JavaScript):
 * the page that holds the form reads the result with Astro.getActionResult and redirects on success.
 * checkAnswer and exerciseText are also called from the exercise script (src/components/exercises).
 * Astro checks the Origin of form posts (security.checkOrigin), so another site cannot submit these.
 */
import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro/zod";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createUser, endSession, startSession, verifyUser } from "@/lib/auth";
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

/** The result of a form that either moves on (redirect) or stays with an error. */
export type FormResult = { ok: true; redirect: string } | { ok: false; error: string; email?: string; body?: string };

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(10).max(200),
  displayName: z.string().trim().max(60).optional(),
});

function localeFrom(form: FormData): Locale {
  const l = form.get("locale");
  return typeof l === "string" && isLocale(l) ? l : "zh";
}

/** A same-site path to return to, or the account page. */
function safeNext(form: FormData, locale: Locale): string {
  const next = form.get("next");
  if (typeof next === "string" && next.startsWith(`/${locale}/`) && !next.startsWith("//")) return next;
  return `/${locale}/account`;
}

/** The page a form was posted from (for returning to it), if it is one of ours. */
function pagePath(form: FormData, locale: Locale): string {
  const p = form.get("path");
  return typeof p === "string" && p.startsWith(`/${locale}/`) && !p.startsWith("//") ? p : `/${locale}`;
}

const ip = (context: ActionAPIContext) => {
  const addr = clientIp(context.request);
  if (addr !== "local") return addr;
  try {
    return context.clientAddress;
  } catch {
    return "local";
  }
};

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

export interface AnswerResult {
  exercise: string;
  checked: boolean;
  correct: boolean;
  answer: string;
  /** Coach-style note (server-rendered HTML): why this answer is wrong, or why the chosen option is right. */
  feedback?: string;
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

export const server = {
  register: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      const locale = localeFrom(form);
      const t = getDictionary(locale).auth.errors;
      if (!hasDatabase()) return { ok: false, error: t.generic };
      const echo = String(form.get("email") ?? "");
      const ipKey = `register:${ip(context)}`;
      if (isLimited(ipKey, 10)) return { ok: false, error: t.tooMany, email: echo };
      record(ipKey, ONE_HOUR);
      const parsed = credentials.safeParse({
        email: form.get("email"),
        password: form.get("password"),
        displayName: form.get("displayName") || undefined,
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return { ok: false, error: issue.path[0] === "email" ? t.invalidEmail : t.shortPassword, email: echo };
      }
      try {
        const user = await createUser(parsed.data.email, parsed.data.password, parsed.data.displayName || null, locale);
        await startSession(context.cookies, user.id);
      } catch (err) {
        const code = (err as { code?: string }).code;
        return { ok: false, error: code === "23505" ? t.emailTaken : t.generic, email: echo };
      }
      return { ok: true, redirect: safeNext(form, locale) };
    },
  }),

  login: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      const locale = localeFrom(form);
      const t = getDictionary(locale).auth.errors;
      if (!hasDatabase()) return { ok: false, error: t.generic };
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      if (!email || !password) return { ok: false, error: t.badCredentials, email };
      const ipKey = `login-ip:${ip(context)}`;
      const accountKey = `login-account:${email.trim().toLowerCase()}`;
      if (isLimited(ipKey, 20) || isLimited(accountKey, 5)) return { ok: false, error: t.tooMany, email };
      try {
        const user = await verifyUser(email, password);
        if (!user) {
          record(ipKey, FIFTEEN_MINUTES);
          record(accountKey, FIFTEEN_MINUTES);
          return { ok: false, error: t.badCredentials, email };
        }
        clear(accountKey);
        await startSession(context.cookies, user.id);
      } catch {
        return { ok: false, error: t.generic, email };
      }
      return { ok: true, redirect: safeNext(form, locale) };
    },
  }),

  logout: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      await endSession(context.cookies);
      return { ok: true, redirect: `/${localeFrom(form)}` };
    },
  }),

  /** Self-service account deletion: the password confirms it is really the owner, then everything is deleted. */
  deleteAccount: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      const locale = localeFrom(form);
      const t = getDictionary(locale).auth;
      const user = context.locals.user;
      if (!user) return { ok: true, redirect: `/${locale}/login` };
      if (form.get("confirm") !== "yes") return { ok: false, error: t.data.needConfirm };
      const key = `delete:${user.id}`;
      if (isLimited(key, 5)) return { ok: false, error: t.errors.tooMany };
      try {
        if (!(await passwordMatches(user.id, String(form.get("password") ?? "")))) {
          record(key, FIFTEEN_MINUTES);
          return { ok: false, error: t.data.wrongPassword };
        }
        await deleteAccount(user.id);
      } catch {
        return { ok: false, error: t.errors.generic };
      }
      await endSession(context.cookies);
      return { ok: true, redirect: `/${locale}/account/deleted` };
    },
  }),

  setProgress: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      const locale = localeFrom(form);
      const user = context.locals.user;
      const slug = String(form.get("slug") ?? "");
      const status = String(form.get("status") ?? "") as ProgressStatus;
      if (user && getConcept(slug) && ["none", "learning", "done"].includes(status)) await setProgress(user.id, slug, status);
      return { ok: true, redirect: `/${locale}/concepts/${getConcept(slug) ? slug : ""}` };
    },
  }),

  checkAnswer: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<AnswerResult> => {
      const id = String(form.get("exercise") ?? "");
      const answer = String(form.get("answer") ?? "").trim().slice(0, 200);
      const exercise = getExercise(id);
      if (!exercise || !answer) return { exercise: id, checked: false, correct: false, answer };
      const correct = checkAnswer(exercise, answer);
      const note = feedbackText(diagnose(exercise, answer), localeFrom(form));
      const user = context.locals.user;
      if (user) await recordAttempt(user.id, id, answer, correct).catch(() => undefined);
      return { exercise: id, checked: true, correct, answer, feedback: note ? richHtml(note) : undefined };
    },
  }),

  /** A hint or solution as HTML, fetched when the reader opens it. */
  exerciseText: defineAction({
    input: z.object({ id: z.string().max(80), part: z.enum(["hint", "solution"]), locale: z.string().max(5) }),
    handler: async ({ id, part, locale }): Promise<string> => {
      const exercise = getExercise(id);
      return exercise ? richHtml(exercise[part][isLocale(locale) ? locale : "zh"]) : "";
    },
  }),

  addComment: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      const locale = localeFrom(form);
      const t = getDictionary(locale).comments.errors;
      // Echoed back on an error, so a form posted without JavaScript keeps what was written.
      const body = String(form.get("body") ?? "").slice(0, COMMENT_MAX_LENGTH * 2);
      const user = context.locals.user;
      if (!user) return { ok: false, error: t.loginRequired, body };
      if (!hasDatabase()) return { ok: false, error: t.generic, body };
      const parsed = commentInput.safeParse({ type: form.get("type"), slug: form.get("slug"), body: form.get("body") ?? "" });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        if (issue.path[0] === "body") return { ok: false, error: issue.code === "too_big" ? t.tooLong : t.empty, body };
        return { ok: false, error: t.generic, body };
      }
      const { type, slug } = parsed.data;
      if (!targetExists(type, slug)) return { ok: false, error: t.generic, body };
      try {
        if (await postedRecently(user.id)) return { ok: false, error: t.tooFast, body };
        await addComment(user.id, { type, slug }, parsed.data.body);
      } catch {
        return { ok: false, error: t.generic, body };
      }
      return { ok: true, redirect: `${pagePath(form, locale)}#comments` };
    },
  }),

  deleteComment: defineAction({
    accept: "form",
    handler: async (form: FormData, context): Promise<FormResult> => {
      const locale = localeFrom(form);
      const user = context.locals.user;
      const id = String(form.get("id") ?? "");
      if (user && /^\d{1,18}$/.test(id) && hasDatabase()) await deleteComment(id, user.id, isAdmin(user)).catch(() => undefined);
      return { ok: true, redirect: `${pagePath(form, locale)}#comments` };
    },
  }),
};
