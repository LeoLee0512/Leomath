import "server-only";
import { tex } from "./katex";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Short text with inline `$…$`, display `$$…$$` and **bold**, rendered to an HTML string on the server.
 * The same format as <RichText>, for content handed to client components: they receive finished
 * markup and never need KaTeX (about 75 KB of JavaScript) in the browser.
 */
export function richHtml(text: string): string {
  return text
    .split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g)
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) return `<div>${tex(part.slice(2, -2), true)}</div>`;
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) return tex(part.slice(1, -1), false);
      return part
        .split(/(\*\*[^*]+\*\*)/g)
        .map((b) => (b.startsWith("**") && b.endsWith("**") && b.length > 4 ? `<strong>${escape(b.slice(2, -2))}</strong>` : escape(b)))
        .join("");
    })
    .join("");
}
