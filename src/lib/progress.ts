import { db } from "./db";

export type ProgressStatus = "none" | "learning" | "done";

export async function getProgress(userId: string): Promise<Record<string, ProgressStatus>> {
  const { rows } = await db().query<{ concept_slug: string; status: "learning" | "done" }>(
    "SELECT concept_slug, status FROM concept_progress WHERE user_id = $1",
    [userId],
  );
  return Object.fromEntries(rows.map((r) => [r.concept_slug, r.status]));
}

export async function setProgress(userId: string, slug: string, status: ProgressStatus): Promise<void> {
  if (status === "none") {
    await db().query("DELETE FROM concept_progress WHERE user_id = $1 AND concept_slug = $2", [userId, slug]);
    return;
  }
  await db().query(
    `INSERT INTO concept_progress(user_id, concept_slug, status) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, concept_slug) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
    [userId, slug, status],
  );
}

export async function recordAttempt(userId: string, exerciseId: string, answer: string, correct: boolean): Promise<void> {
  await db().query(
    "INSERT INTO exercise_attempts(user_id, exercise_id, answer, correct) VALUES ($1, $2, $3, $4)",
    [userId, exerciseId, answer.slice(0, 200), correct],
  );
}

export interface ExerciseSummary {
  attempts: number;
  solved: boolean;
}

export async function getExerciseSummary(userId: string): Promise<Record<string, ExerciseSummary>> {
  const { rows } = await db().query<{ exercise_id: string; attempts: string; solved: boolean }>(
    `SELECT exercise_id, count(*)::text AS attempts, bool_or(correct) AS solved
     FROM exercise_attempts WHERE user_id = $1 GROUP BY exercise_id`,
    [userId],
  );
  return Object.fromEntries(rows.map((r) => [r.exercise_id, { attempts: Number(r.attempts), solved: r.solved }]));
}
