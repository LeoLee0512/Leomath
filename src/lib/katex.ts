import katex from "katex";

/** Render LaTeX to an HTML string on the server or client. */
export function tex(source: string, display = false): string {
  return katex.renderToString(source, {
    displayMode: display,
    throwOnError: false,
    strict: "ignore",
    trust: false,
    output: "htmlAndMathml",
  });
}
