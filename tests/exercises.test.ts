import { describe, expect, it } from "vitest";
import { checkAnswer, diagnose, exercises, getExercise } from "@/content/exercises";
import { numericMistakes, optionFeedback } from "@/content/exercise-feedback";

describe("exercise feedback coverage", () => {
  it("every choice exercise explains every option, in both languages", () => {
    for (const e of exercises) {
      if (e.kind !== "choice") continue;
      const notes = optionFeedback[e.id];
      expect(notes, e.id).toBeDefined();
      expect(notes.length, e.id).toBe(e.options.length);
      for (const n of notes) {
        expect(n.zh.length, e.id).toBeGreaterThan(0);
        expect(n.en.length, e.id).toBeGreaterThan(0);
      }
    }
  });

  it("feedback only refers to existing exercises of the right kind", () => {
    for (const id of Object.keys(optionFeedback)) expect(getExercise(id)?.kind, id).toBe("choice");
    for (const id of Object.keys(numericMistakes)) expect(getExercise(id)?.kind, id).toBe("numeric");
  });

  it("a known mistake is really wrong", () => {
    for (const [id, list] of Object.entries(numericMistakes)) {
      const e = getExercise(id)!;
      for (const m of list) expect(checkAnswer(e, String(m.value)), `${id} ${m.value}`).toBe(false);
    }
  });
});

describe("diagnosing numeric answers", () => {
  const ex = (id: string) => getExercise(id)!;

  it("says nothing about a correct answer", () => {
    expect(diagnose(ex("limit-1"), "3")).toBeNull();
  });
  it("recognises a known mistake, even rounded", () => {
    expect(diagnose(ex("probability-space-1"), "1/11")).toMatchObject({ kind: "note" });
    expect(diagnose(ex("conditional-probability-4"), "0.11")).toMatchObject({ kind: "note" });
  });
  it("spots a sign error, a reciprocal, a percentage and a near miss", () => {
    expect(diagnose(ex("limit-1"), "-3")).toEqual({ kind: "sign" });
    expect(diagnose(ex("limit-1"), "1/3")).toEqual({ kind: "reciprocal" });
    expect(diagnose(ex("conditional-probability-2"), "62.5")).toEqual({ kind: "scale", factor: 100 });
    expect(diagnose(ex("derivative-2"), "0.70")).toMatchObject({ kind: "near" });
  });
  it("asks for a number when the input cannot be read", () => {
    expect(diagnose(ex("limit-1"), "three")).toEqual({ kind: "unreadable" });
  });
  it("gives no generic guess for an answer that is simply different", () => {
    expect(diagnose(ex("limit-1"), "7")).toBeNull();
  });
});

describe("diagnosing choices", () => {
  it("returns the note for the chosen option, right or wrong", () => {
    const e = getExercise("conditional-probability-3")!;
    expect(diagnose(e, "0")).toMatchObject({ kind: "note" });
    expect(diagnose(e, "1")).toMatchObject({ kind: "note" });
  });
});

describe("rounded percentages are still recognised", () => {
  it("1/6 written as 16.7 and 0.5875 written as 59", () => {
    expect(diagnose(getExercise("probability-space-1")!, "16.7")).toEqual({ kind: "scale", factor: 100 });
    expect(diagnose(getExercise("conditional-probability-4")!, "59")).toEqual({ kind: "scale", factor: 100 });
  });
  it("correctly rounded answers pass the tightened tolerances, off-by-one-digit ones do not", () => {
    const e = getExercise("what-is-ode-1")!;
    expect(checkAnswer(e, "22.17")).toBe(true);
    expect(checkAnswer(e, "22.13")).toBe(false);
    const i = getExercise("integral-1")!;
    expect(checkAnswer(i, "0.3333")).toBe(true);
    expect(checkAnswer(i, "0.334")).toBe(false);
  });
});
