import { tex } from "@/lib/katex";

/** One legend entry: a swatch in the series style (line, dot, ring or filled square), its name, and optionally its formula. */
export function LegendItem({ color, label, dash, dot, ring, square, formula }: { color: string; label: string; dash?: string; dot?: boolean; ring?: boolean; square?: boolean; formula?: string }) {
  return (
    <li className="inline-flex items-center gap-2 whitespace-nowrap">
      <svg width="22" height="10" aria-hidden="true" className="shrink-0">
        {square ? (
          <rect x="4" y="0" width="14" height="10" rx="1.5" fill={color} />
        ) : ring ? (
          <circle cx="11" cy="5" r="3.4" fill="none" stroke={color} strokeWidth="1.4" />
        ) : dot ? (
          <circle cx="11" cy="5" r="4" fill={color} />
        ) : (
          <line x1="1" y1="5" x2="21" y2="5" stroke={color} strokeWidth="2.2" strokeDasharray={dash} strokeLinecap={dash ? "butt" : "round"} />
        )}
      </svg>
      <span>{label}</span>
      {formula && <span className="text-muted" dangerouslySetInnerHTML={{ __html: tex(formula) }} />}
    </li>
  );
}
