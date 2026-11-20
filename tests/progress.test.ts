import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { canRecordProgress, setProgress } from "@/lib/progress";

let pg: PGlite;
let userId: string;

beforeAll(async () => {
  process.env.DATABASE_URL = "postgres://progress-test";
  pg = new PGlite({ extensions: { pgcrypto } });
  globalThis.__leomathPool = pg as never;
  const dir = path.resolve("db/migrations");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(await readFile(path.join(dir, file), "utf8"));
  }
});

beforeEach(async () => {
  await pg.query("DELETE FROM concept_progress");
  await pg.query("DELETE FROM users");
  const { rows } = await pg.query<{ id: string }>("INSERT INTO users(email, password_hash) VALUES ($1, $2) RETURNING id", ["progress@example.com", "not-a-real-hash"]);
  userId = rows[0].id;
});

afterAll(async () => {
  await pg.close();
});

describe("progress validation", () => {
  it("allows and stores progress for a published concept", async () => {
    expect(canRecordProgress("derivative", "done")).toBe(true);
    await setProgress(userId, "derivative", "done");
    const { rows } = await pg.query("SELECT status FROM concept_progress WHERE user_id = $1 AND concept_slug = 'derivative'", [userId]);
    expect(rows).toEqual([{ status: "done" }]);
  });

  it("rejects planned concepts", () => {
    expect(canRecordProgress("pde", "done")).toBe(false);
    expect(canRecordProgress("multivariable-calculus", "learning")).toBe(false);
  });

  it("rejects unknown concepts and statuses", () => {
    expect(canRecordProgress("not-a-concept", "done")).toBe(false);
    expect(canRecordProgress("derivative", "mastered")).toBe(false);
  });
});
