import { tex } from "@/lib/katex";

/** Inline LaTeX. */
export function M({ children, className }: { children: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: tex(children, false) }} />;
}

/** Display LaTeX. */
export function MB({ children, className }: { children: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: tex(children, true) }} />;
}

/**
 * Text with inline `$…$` and display `$$…$$` math, for exercise statements and short notes.
 * Also supports **bold**.
 */
export function RichText({ children, className }: { children: string; className?: string }) {
  const parts = children.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$")) return <MB key={i}>{part.slice(2, -2)}</MB>;
        if (part.startsWith("$")) return <M key={i}>{part.slice(1, -1)}</M>;
        const bold = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {bold.map((b, j) => (b.startsWith("**") ? <strong key={j}>{b.slice(2, -2)}</strong> : b))}
          </span>
        );
      })}
    </span>
  );
}
