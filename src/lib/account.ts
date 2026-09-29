import bcrypt from "bcryptjs";
import { db } from "./db";

/** Anything with pg's `query(text, params) → { rows }` shape: the pool in production, an in-memory Postgres in tests. */
export interface Queryable {
  query<R = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

const pool = (): Queryable => db() as unknown as Queryable;

export interface UserDataExport {
  exportedAt: string;
  account: { email: string; displayName: string | null; locale: string; createdAt: string } | null;
  progress: { concept: string; status: string; updatedAt: string }[];
  exerciseAttempts: { exercise: string; answer: string; correct: boolean; at: string }[];
  comments: { on: string; slug: string; body: string; at: string; deletedAt: string | null }[];
  /** Active and expired sign-ins (the token itself is never stored, only its hash, which is not exported). */
  sessions: { createdAt: string; expiresAt: string }[];
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d));

/** Everything the site stores about one user, for “download my data”. The password hash is left out. */
export async function exportUserData(userId: string, q: Queryable = pool()): Promise<UserDataExport> {
  const [account, progress, attempts, comments, sessions] = await Promise.all([
    q.query<{ email: string; display_name: string | null; locale: string; created_at: Date }>(
      "SELECT email, display_name, locale, created_at FROM users WHERE id = $1", [userId]),
    q.query<{ concept_slug: string; status: string; updated_at: Date }>(
      "SELECT concept_slug, status, updated_at FROM concept_progress WHERE user_id = $1 ORDER BY updated_at", [userId]),
    q.query<{ exercise_id: string; answer: string; correct: boolean; created_at: Date }>(
      "SELECT exercise_id, answer, correct, created_at FROM exercise_attempts WHERE user_id = $1 ORDER BY created_at", [userId]),
    q.query<{ target_type: string; target_slug: string; body: string; created_at: Date; deleted_at: Date | null }>(
      "SELECT target_type, target_slug, body, created_at, deleted_at FROM comments WHERE user_id = $1 ORDER BY created_at", [userId]),
    q.query<{ created_at: Date; expires_at: Date }>(
      "SELECT created_at, expires_at FROM sessions WHERE user_id = $1 ORDER BY created_at", [userId]),
  ]);
  const a = account.rows[0];
  return {
    exportedAt: new Date().toISOString(),
    account: a ? { email: a.email, displayName: a.display_name, locale: a.locale, createdAt: iso(a.created_at) } : null,
    progress: progress.rows.map((r) => ({ concept: r.concept_slug, status: r.status, updatedAt: iso(r.updated_at) })),
    exerciseAttempts: attempts.rows.map((r) => ({ exercise: r.exercise_id, answer: r.answer, correct: r.correct, at: iso(r.created_at) })),
    comments: comments.rows.map((r) => ({ on: r.target_type, slug: r.target_slug, body: r.body, at: iso(r.created_at), deletedAt: r.deleted_at ? iso(r.deleted_at) : null })),
    sessions: sessions.rows.map((r) => ({ createdAt: iso(r.created_at), expiresAt: iso(r.expires_at) })),
  };
}

/** Whether `password` is this user's password. Used to confirm account deletion. */
export async function passwordMatches(userId: string, password: string, q: Queryable = pool()): Promise<boolean> {
  const { rows } = await q.query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [userId]);
  if (rows.length === 0) return false;
  return bcrypt.compare(password, rows[0].password_hash);
}

/**
 * Deletes the account. Sessions, progress, exercise attempts and comments (including soft-deleted ones)
 * reference users(id) with ON DELETE CASCADE, so this one statement removes everything the user left here.
 */
export async function deleteAccount(userId: string, q: Queryable = pool()): Promise<void> {
  await q.query("DELETE FROM users WHERE id = $1", [userId]);
}
