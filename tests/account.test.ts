import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import bcrypt from "bcryptjs";
import { deleteAccount, exportUserData, passwordMatches, type Queryable } from "@/lib/account";

// A real Postgres (compiled to WebAssembly) running the site's own migrations.
let pg: PGlite;
const q = (): Queryable => pg as unknown as Queryable;

async function makeUser(email: string, password: string): Promise<string> {
  const hash = await bcrypt.hash(password, 4);
  const { rows } = await pg.query<{ id: string }>("INSERT INTO users(email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id", [email, hash, email.split("@")[0]]);
  const id = rows[0].id;
  await pg.query("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '1 day')", [`t-${email}`, id]);
  await pg.query("INSERT INTO concept_progress(user_id, concept_slug, status) VALUES ($1, 'derivative', 'done')", [id]);
  await pg.query("INSERT INTO exercise_attempts(user_id, exercise_id, answer, correct) VALUES ($1, 'derivative-1', '10', true)", [id]);
  await pg.query("INSERT INTO comments(user_id, target_type, target_slug, body) VALUES ($1, 'concept', 'derivative', 'visible')", [id]);
  await pg.query("INSERT INTO comments(user_id, target_type, target_slug, body, deleted_at) VALUES ($1, 'concept', 'limit', 'soft-deleted', now())", [id]);
  return id;
}

async function count(table: string, userId: string): Promise<number> {
  const { rows } = await pg.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${table} WHERE user_id = $1`, [userId]);
  return rows[0].n;
}

beforeAll(async () => {
  pg = new PGlite({ extensions: { pgcrypto } });
  const dir = path.resolve("db/migrations");
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".sql")).sort()) {
    await pg.exec(await readFile(path.join(dir, f), "utf8"));
  }
});

describe("account data export and deletion", () => {
  it("exports everything stored about the user, without the password hash", async () => {
    const id = await makeUser("export@example.com", "correct horse battery");
    const data = await exportUserData(id, q());
    expect(data.account?.email).toBe("export@example.com");
    expect(data.progress).toEqual([expect.objectContaining({ concept: "derivative", status: "done" })]);
    expect(data.exerciseAttempts).toEqual([expect.objectContaining({ exercise: "derivative-1", answer: "10", correct: true })]);
    expect(data.comments.map((c) => c.body).sort()).toEqual(["soft-deleted", "visible"]);
    expect(JSON.stringify(data)).not.toMatch(/\$2[aby]\$/);
  });

  it("checks the password before deletion", async () => {
    const id = await makeUser("pw@example.com", "correct horse battery");
    expect(await passwordMatches(id, "correct horse battery", q())).toBe(true);
    expect(await passwordMatches(id, "wrong password here", q())).toBe(false);
    expect(await passwordMatches("00000000-0000-0000-0000-000000000000", "anything", q())).toBe(false);
  });

  it("deleting an account removes every linked row, including soft-deleted comments, and nobody else's", async () => {
    const gone = await makeUser("gone@example.com", "correct horse battery");
    const kept = await makeUser("kept@example.com", "correct horse battery");
    await deleteAccount(gone, q());
    const { rows } = await pg.query("SELECT 1 FROM users WHERE id = $1", [gone]);
    expect(rows).toHaveLength(0);
    for (const table of ["sessions", "concept_progress", "exercise_attempts", "comments"]) {
      expect(await count(table, gone), table).toBe(0);
      expect(await count(table, kept), table).toBeGreaterThan(0);
    }
  });

  it("new accounts are not moderators; the flag lives in the database", async () => {
    const id = await makeUser("plain@example.com", "correct horse battery");
    const { rows } = await pg.query<{ is_admin: boolean }>("SELECT is_admin FROM users WHERE id = $1", [id]);
    expect(rows[0].is_admin).toBe(false);
  });

  it("every table that references users cascades on delete", async () => {
    // Guards future migrations: a new table pointing at users without ON DELETE CASCADE would block or leak deletion.
    const { rows } = await pg.query<{ table_name: string; delete_rule: string }>(`
      SELECT tc.table_name, rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage cu ON cu.constraint_name = rc.unique_constraint_name
      WHERE cu.table_name = 'users'`);
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const r of rows) expect(r.delete_rule, r.table_name).toBe("CASCADE");
  });
});
