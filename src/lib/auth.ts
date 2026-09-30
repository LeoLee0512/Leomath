import { createHash, randomBytes } from "node:crypto";
import type { AstroCookies } from "astro";
import bcrypt from "bcryptjs";
import { db, hasDatabase } from "./db";

export const SESSION_COOKIE = "leomath_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  /** May delete any comment. Set in the database (users.is_admin), never derived from the email. */
  isAdmin: boolean;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUser(email: string, password: string, displayName: string | null, locale: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await db().query<{ id: string; email: string; display_name: string | null; is_admin: boolean }>(
    `INSERT INTO users(email, password_hash, display_name, locale)
     VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, is_admin`,
    [email.toLowerCase(), passwordHash, displayName, locale],
  );
  return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name, isAdmin: rows[0].is_admin };
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const { rows } = await db().query<{ id: string; email: string; display_name: string | null; is_admin: boolean; password_hash: string }>(
    "SELECT id, email, display_name, is_admin, password_hash FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  if (rows.length === 0) {
    // Burn comparable time so timing does not reveal whether the email exists.
    await bcrypt.compare(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8XkI0Wl7B4Xw7X5hSp5YB1fXy7l1Wm");
    return null;
  }
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name, isAdmin: rows[0].is_admin };
}

export async function startSession(cookies: AstroCookies, userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db().query(
    "INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), userId, expires],
  );
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token && hasDatabase()) {
    await db().query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]).catch(() => undefined);
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

/** The signed-in user for a request, or null. src/middleware.ts calls this once and keeps it in locals.user. */
export async function currentUser(cookies: AstroCookies): Promise<User | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token || !hasDatabase()) return null;
  try {
    const { rows } = await db().query<{ id: string; email: string; display_name: string | null; is_admin: boolean }>(
      `SELECT u.id, u.email, u.display_name, u.is_admin
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name, isAdmin: rows[0].is_admin };
  } catch {
    return null;
  }
}
