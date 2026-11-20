import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";

let child: ChildProcess;
const base = "http://127.0.0.1:3101";
const ip = "203.0.113.42";

beforeAll(async () => {
  await promisify(execFile)("npm", ["run", "build"], { cwd: process.cwd(), shell: true });
  child = spawn(process.execPath, ["dist/server/entry.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "3101", HOST: "127.0.0.1", DATABASE_URL: "", SITE_URL: base, NODE_ENV: "development" },
    stdio: "ignore",
  });
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/zh`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("production server did not start in time");
}, 120_000);

afterAll(async () => {
  child.kill();
});

async function postExerciseText(): Promise<Response> {
  return fetch(`${base}/_actions/exerciseText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      Referer: `${base}/zh`,
      "X-Real-IP": ip,
    },
    body: JSON.stringify({ id: "derivative-1", part: "hint", locale: "zh" }),
  });
}

describe("exercise action rate limiting", () => {
  it("applies a shared per-IP limit to answer checking and hint rendering", async () => {
    for (let i = 0; i < 120; i++) {
      const response = await postExerciseText();
      if (!response.ok) throw new Error(`request ${i + 1} failed with ${response.status}`);
    }
    const limitedText = await (await postExerciseText()).text();
    expect(limitedText).toContain("尝试次数过多");

    const answer = await fetch(`${base}/_actions/checkAnswer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: base,
        Referer: `${base}/zh/concepts/derivative`,
        "X-Real-IP": ip,
      },
      body: new URLSearchParams({ locale: "zh", exercise: "derivative-1", answer: "10" }),
    });
    const result = await answer.json() as unknown;
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain(false);
  }, 60_000);
});
