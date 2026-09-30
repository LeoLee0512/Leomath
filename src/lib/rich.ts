import { CLOSING_PUNCTUATION, OPENING_PUNCTUATION, escapeHtml, glued, tex } from "./tex";

/**
 * Short text with inline `$…$`, display `$$…$$` and **bold**, rendered to an HTML string on the server.
 * Used for exercises, observation questions, comments and feedback: the browser receives finished markup
 * and never needs a maths library.
 */
export function richHtml(text: string): string {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  const isInline = (p: string | undefined) => p !== undefined && !p.startsWith("$$") && p.startsWith("$") && p.endsWith("$") && p.length > 2;
  // Move punctuation next to an inline formula into the formula's unbreakable group.
  const glue: { before: string; after: string }[] = parts.map(() => ({ before: "", after: "" }));
  parts.forEach((p, i) => {
    if (!isInline(p)) return;
    const next = parts[i + 1];
    const m = next?.match(CLOSING_PUNCTUATION);
    if (m) {
      glue[i].after = m[0];
      parts[i + 1] = next!.slice(m[0].length);
    }
    const prev = parts[i - 1];
    const o = prev?.match(OPENING_PUNCTUATION);
    if (o && !isInline(prev)) {
      glue[i].before = o[0];
      parts[i - 1] = prev!.slice(0, -o[0].length);
    }
  });
  return parts
    .map((part, i) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) return `<div class="math-display">${tex(part.slice(2, -2), true)}</div>`;
      if (isInline(part)) return glued(glue[i].before, tex(part.slice(1, -1), false), glue[i].after);
      return part
        .split(/(\*\*[^*]+\*\*)/g)
        .map((b) => (b.startsWith("**") && b.endsWith("**") && b.length > 4 ? `<strong>${escapeHtml(b.slice(2, -2))}</strong>` : escapeHtml(b)))
        .join("");
    })
    .join("");
}
