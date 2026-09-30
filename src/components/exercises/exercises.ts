/**
 * Exercises, enhanced: check an answer in place (the checkAnswer action), keep a solved exercise ticked,
 * count solved exercises in the set, and load hints and solutions the first time they are opened.
 * Without this script the cards still work: the form posts and the page shows the result.
 */
import { actions } from "astro:actions";

function markSolved(card: HTMLElement) {
  if (card.dataset.solved) return;
  card.dataset.solved = "1";
  card.classList.replace("border-rule", "border-e2/50");
  const number = card.querySelector<HTMLElement>("[data-number]")!;
  number.classList.replace("text-muted", "text-e2");
  number.querySelector<HTMLElement>("[data-mark]")!.textContent = "✓";
  card.querySelector<HTMLElement>("[data-solved-label]")!.hidden = false;
  const set = card.closest<HTMLElement>("[data-exercise-set]");
  if (!set) return;
  const total = Number(set.dataset.total);
  const done = set.querySelectorAll("[data-exercise-card][data-solved]").length;
  const count = set.querySelector<HTMLElement>("[data-count]")!;
  count.textContent = set.dataset.template!.replace("{d}", String(done)).replace("{n}", String(total));
  if (done === total) {
    count.classList.replace("text-muted", "text-e2");
    set.querySelector<HTMLElement>("[data-all-done]")!.hidden = false;
  }
}

function feedbackHtml(region: HTMLElement, correct: boolean, feedback?: string) {
  const box = document.createElement("div");
  box.className = `mt-3 px-3 py-2 text-sm border-l-2 ${correct ? "exercise-correct border-e2 bg-e2/10" : "border-e1"}`;
  const p = document.createElement("p");
  p.className = correct ? "text-e2 font-medium" : "text-e1";
  p.textContent = correct ? `✓ ${region.dataset.correct}` : region.dataset.incorrect!;
  box.append(p);
  if (feedback) {
    const note = document.createElement("div");
    note.className = "mt-1 text-ink-2 prose-math text-[0.95rem] leading-relaxed";
    // Server-rendered by the action (escaped text and MathML).
    note.innerHTML = feedback;
    box.append(note);
  }
  region.replaceChildren(box);
}

for (const card of document.querySelectorAll<HTMLElement>("[data-exercise-card]")) {
  const id = card.dataset.id!;
  const locale = card.dataset.locale!;
  const form = card.querySelector("form")!;
  const region = card.querySelector<HTMLElement>("[data-feedback]")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (!String(data.get("answer") ?? "").trim()) return;
    const buttons = form.querySelectorAll("button");
    buttons.forEach((b) => (b.disabled = true));
    try {
      const { data: result, error } = await actions.checkAnswer(data);
      if (error || !result?.checked) return;
      feedbackHtml(region, result.correct, result.feedback);
      if (result.correct) markSolved(card);
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  });

  for (const button of card.querySelectorAll<HTMLButtonElement>("button[data-part]")) {
    const part = button.dataset.part as "hint" | "solution";
    const box = card.querySelector<HTMLElement>(`[data-text="${part}"]`)!;
    button.hidden = false;
    button.addEventListener("click", async () => {
      const open = box.hidden;
      box.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      if (!open || box.dataset.loaded) return;
      box.setAttribute("aria-busy", "true");
      box.textContent = "…";
      const { data } = await actions.exerciseText({ id, part, locale });
      box.innerHTML = data ?? "";
      box.dataset.loaded = "1";
      box.removeAttribute("aria-busy");
    });
  }
}
