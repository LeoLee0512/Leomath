import "server-only";
import { db } from "./db";

export type CommentTargetType = "concept" | "experiment" | "software";
export const COMMENT_TARGET_TYPES: readonly CommentTargetType[] = ["concept", "experiment", "software"];

export interface CommentTarget {
  type: CommentTargetType;
  slug: string;
}

export interface Comment {
  id: string;
  userId: string;
  author: { displayName: string | null; email: string };
  body: string;
  createdAt: Date;
}

export const COMMENT_MAX_LENGTH = 2000;
/** Minimum seconds between two comments by the same user. */
export const COMMENT_COOLDOWN_SECONDS = 20;

export async function listComments(target: CommentTarget): Promise<Comment[]> {
  const { rows } = await db().query<{ id: string; user_id: string; display_name: string | null; email: string; body: string; created_at: Date }>(
    `SELECT c.id::text, c.user_id, u.display_name, u.email, c.body, c.created_at
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.target_type = $1 AND c.target_slug = $2 AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC
     LIMIT 500`,
    [target.type, target.slug],
  );
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    author: { displayName: r.display_name, email: r.email },
    body: r.body,
    createdAt: r.created_at,
  }));
}

/** True when the user posted within the cooldown window. */
export async function postedRecently(userId: string): Promise<boolean> {
  const { rows } = await db().query(
    `SELECT 1 FROM comments WHERE user_id = $1 AND created_at > now() - make_interval(secs => $2) LIMIT 1`,
    [userId, COMMENT_COOLDOWN_SECONDS],
  );
  return rows.length > 0;
}

export async function addComment(userId: string, target: CommentTarget, body: string): Promise<void> {
  await db().query(
    "INSERT INTO comments(user_id, target_type, target_slug, body) VALUES ($1, $2, $3, $4)",
    [userId, target.type, target.slug, body],
  );
}

/** Soft-deletes the comment when it belongs to the user, or when `admin` is true. */
export async function deleteComment(id: string, userId: string, admin: boolean): Promise<void> {
  await db().query(
    `UPDATE comments SET deleted_at = now()
     WHERE id = $1 AND deleted_at IS NULL AND ($3 OR user_id = $2)`,
    [id, userId, admin],
  );
}

/** Site moderators, from the comma-separated ADMIN_EMAILS environment variable. */
export function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
