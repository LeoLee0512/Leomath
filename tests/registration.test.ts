import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createUserAndSession } from "@/lib/auth";

let pg: PGlite;
let jar: Map<string, string>;
let cookies: { set: (name: string, value: string) => void };

beforeAll(async () => {
  process.env.DATABASE_URL = "postgres://registration-test";
  pg = new PGlite({ extensions: { pgcrypto } });
  globalThis.__leomathPool = {
    query: pg.query.bind(pg),
    connect: async () => ({ query: pg.query.bind(pg), release: () => undefined }),
  } as never;
  const dir = path.resolve("db/migrations");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(await readFile(path.join(dir, file), "utf8"));
  }
});

beforeEach(async () => {
  await pg.exec("DROP TABLE IF EXISTS sessions");
  await pg.exec("CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL)");
  await pg.query("DELETE FROM sessions");
  await pg.query("DELETE FROM users");
  jar = new Map();
  cookies = { set: (name, value) => { jar.set(name, value); } };
});

afterAll(async () => {
  await pg.close();
});

describe("registration transaction", () => {
  it("creates the user and session together", async () => {
    const user = await createUserAndSession("new@example.com", "password123", null, "zh", cookies as never);
    expect(user.email).toBe("new@example.com");
    const { rows: users } = await pg.query("SELECT email FROM users WHERE email = $1", [user.email]);
    const { rows: sessions } = await pg.query("SELECT user_id FROM sessions WHERE user_id = $1", [user.id]);
    expect(users).toHaveLength(1);
    expect(sessions).toHaveLength(1);
    expect(jar.has("leomath_session")).toBe(true);
  });

  it("rolls back the user when session creation fails", async () => {
    await pg.exec("DROP TABLE sessions");
    await expect(createUserAndSession("rollback@example.com", "password123", null, "zh", cookies as never)).rejects.toThrow();
    const { rows } = await pg.query("SELECT 1 FROM users WHERE email = 'rollback@example.com'");
    expect(rows).toHaveLength(0);
    expect(jar.has("leomath_session")).toBe(false);
  });
});
