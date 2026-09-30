import temml from "temml";

/**
 * LaTeX → MathML (Temml), laid out natively by the browser in the STIX Two Math font (src/styles/math.css).
 * One compact <math> element per formula; nothing but the markup reaches the browser.
 */
export function tex(source: string, display = false): string {
  const render = (s: string) => splitNumberLists(temml.renderToString(s, { displayMode: display, throwOnError: false, trust: false }));
  if (display || source.replace(/\s/g, "").length < LONG_INLINE) return render(source);
  // A <math> element never breaks across lines in Chromium or Safari, so a long inline formula is set as
  // several, split after its top-level relations the way TeX breaks lines, with a break opportunity between.
  const parts = splitAtRelations(source).flatMap((p) => (p.replace(/\s/g, "").length < LONG_INLINE ? [p] : splitAtBinaries(p)));
  return parts.map(render).join("<wbr>");
}

/**
 * Split TeX after each top-level binary + or − (not a sign: not at the start or after another operator),
 * for a stretch between relations that is still too long for a phone screen.
 */
export function splitAtBinaries(source: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let prev = "";
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "\\") {
      const command = source.slice(i).match(/^\\([a-zA-Z]+|.)/)![0];
      const name = command.slice(1);
      if (name === "left" || name === "begin") depth++;
      else if (name === "right" || name === "end") depth--;
      i += command.length - 1;
      prev = command;
      continue;
    }
    if ("{([".includes(c)) depth++;
    else if ("})]".includes(c)) depth--;
    const binary = (c === "+" || c === "-") && depth === 0 && i > start && prev !== "" && !/^[=<>+\-,^_(]$/.test(prev) && i < source.length - 1;
    if (binary) {
      parts.push(source.slice(start, i + 1));
      start = i + 1;
    }
    if (!/\s/.test(c)) prev = c;
  }
  if (start < source.length) parts.push(source.slice(start));
  return depth === 0 ? parts.filter((p) => p.trim()) : [source];
}

/** Inline formulas at least this long (without spaces) may be broken across lines. */
const LONG_INLINE = 24;
const RELATION = /^\\(?:le|leq|ge|geq|ne|neq|approx|sim|simeq|equiv|to|rightarrow|longrightarrow|Rightarrow|Longrightarrow|iff|in|notin|subset|subseteq|mapsto)(?![a-zA-Z])/;

/**
 * Split TeX after each relation (=, <, >, \le, \to, …) that is not inside braces, brackets, parentheses,
 * \left…\right or an environment. Each part is a complete formula on its own.
 */
export function splitAtRelations(source: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  const cut = (end: number) => {
    parts.push(source.slice(start, end));
    start = end;
  };
  while (i < source.length) {
    const c = source[i];
    if (c === "\\") {
      const command = source.slice(i).match(/^\\([a-zA-Z]+|.)/)![0];
      const name = command.slice(1);
      if (name === "left" || name === "begin") depth++;
      else if (name === "right" || name === "end") depth--;
      i += command.length;
      if (depth === 0 && RELATION.test(command)) cut(i);
      continue;
    }
    if ("{([".includes(c)) depth++;
    else if ("})]".includes(c)) depth--;
    i++;
    if (depth === 0 && "=<>".includes(c) && i < source.length) cut(i);
  }
  if (start < source.length) parts.push(source.slice(start));
  const nonEmpty = parts.filter((p) => p.trim());
  return depth === 0 ? nonEmpty : [source];
}

/**
 * Temml reads digits separated by commas as one number (a thousands separator): `[0,1]` would become the
 * single number “0,1”, drawn without the space after the comma and read aloud as one number. LeoMath never
 * writes thousands separators in formulas, so such a run is a list: split it back into numbers and commas.
 */
export function splitNumberLists(html: string): string {
  return html.replace(/<mn>(\d+(?:\.\d+)?(?:,\d+(?:\.\d+)?)+)<\/mn>/g, (_, run: string) =>
    run.split(",").map((n) => `<mn>${n}</mn>`).join('<mo separator="true">,</mo>'),
  );
}

/** Punctuation that must not start a line, so it is kept on the same line as the formula before it. */
export const CLOSING_PUNCTUATION = /^[，。、；：！？）》」』”’,.;:!?)%]+/;
/** Brackets that must not end a line, kept with the formula after them. */
export const OPENING_PUNCTUATION = /[（《「『“‘(]+$/;

/** An inline formula glued to the punctuation around it, so a line never begins with “，” or ends with “（”. */
export function glued(before: string, html: string, after: string): string {
  if (!before && !after) return html;
  // Only the first part keeps the bracket before it and the last part the punctuation after it,
  // so a long formula split by tex() can still break between its parts.
  const parts = html.split("<wbr>");
  if (before) parts[0] = `<span class="math-glue">${escapeHtml(before)}${parts[0]}</span>`;
  const last = parts.length - 1;
  if (after) parts[last] = before && last === 0 ? parts[0].replace(/<\/span>$/, `${escapeHtml(after)}</span>`) : `<span class="math-glue">${parts[last]}${escapeHtml(after)}</span>`;
  return parts.join("<wbr>");
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
