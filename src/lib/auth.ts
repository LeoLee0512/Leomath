import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { db, hasDatabase } from "./db";

export const SESSION_COOKIE = "leomath_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  displayName: string | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUser(email: string, password: string, displayName: string | null, locale: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await db().query<{ id: string; email: string; display_name: string | null }>(
    `INSERT INTO users(email, password_hash, display_name, locale)
     VALUES ($1, $2, $3, $4) RETURNING id, email, display_name`,
    [email.toLowerCase(), passwordHash, displayName, locale],
  );
  return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name };
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const { rows } = await db().query<{ id: string; email: string; display_name: string | null; password_hash: string }>(
    "SELECT id, email, display_name, password_hash FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  if (rows.length === 0) {
    // Burn comparable time so timing does not reveal whether the email exists.
    await bcrypt.compare(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8XkI0Wl7B4Xw7X5hSp5YB1fXy7l1Wm");
    return null;
  }
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name };
}

export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db().query(
    "INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), userId, expires],
  );
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && hasDatabase()) {
    await db().query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]).catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  // Read cookies first so every page depending on the user is rendered per request.
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || !hasDatabase()) return null;
  try {
    const { rows } = await db().query<{ id: string; email: string; display_name: string | null }>(
      `SELECT u.id, u.email, u.display_name
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name };
  } catch {
    return null;
  }
});
