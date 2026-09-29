/**
 * One legend entry: a swatch in the series style (line, dot, ring or filled square), its name, and optionally its formula (server-rendered HTML).
 * Pass colours as CSS values (e.g. "var(--e1)"), so the swatch is right before hydration and in dark mode.
 */
export function LegendItem({ color, label, dash, dot, ring, square, squareRing, formulaHtml }: { color: string; label: string; dash?: string; dot?: boolean; ring?: boolean; square?: boolean; squareRing?: boolean; formulaHtml?: string }) {
  return (
    <li className="inline-flex items-center gap-2 whitespace-nowrap">
      <svg width="22" height="10" aria-hidden="true" className="shrink-0">
        {squareRing ? (
          <rect x="7.5" y="1.5" width="7" height="7" fill="none" strokeWidth="1.4" style={{ stroke: color }} />
        ) : square ? (
          <rect x="4" y="0" width="14" height="10" rx="1.5" style={{ fill: color }} />
        ) : ring ? (
          <circle cx="11" cy="5" r="3.4" fill="none" strokeWidth="1.4" style={{ stroke: color }} />
        ) : dot ? (
          <circle cx="11" cy="5" r="4" style={{ fill: color }} />
        ) : (
          <line x1="1" y1="5" x2="21" y2="5" style={{ stroke: color }} strokeWidth="2.2" strokeDasharray={dash} strokeLinecap={dash ? "butt" : "round"} />
        )}
      </svg>
      <span>{label}</span>
      {formulaHtml && <span className="text-muted" dangerouslySetInnerHTML={{ __html: formulaHtml }} />}
    </li>
  );
}
