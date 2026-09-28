"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { concepts, getConcept, prerequisiteChain, prerequisiteClosure } from "@/content/graph";

/** Hand-laid positions in a 1000 × 720 viewBox. */
const positions: Record<string, [number, number]> = {
  mathematics: [500, 40],
  analysis: [260, 125],
  algebra: [620, 125],
  geometry: [870, 125],
  functions: [110, 215],
  limit: [300, 215],
  vectors: [620, 215],
  "plane-geometry": [870, 215],
  derivative: [300, 305],
  "linear-maps": [620, 305],
  integral: [190, 395],
  "what-is-ode": [430, 395],
  matrices: [620, 395],
  "taylor-series": [110, 485],
  "first-order-ode": [430, 485],
  eigenvalues: [620, 485],
  "group-theory": [870, 485],
  "multivariable-calculus": [120, 585],
  "numerical-ode": [330, 585],
  "second-order-linear-ode": [580, 585],
  "numerical-analysis": [330, 675],
  pde: [580, 675],
};

/** Structural (taxonomy) edges drawn in addition to prerequisite edges. */
const treeEdges: [string, string][] = [
  ["mathematics", "analysis"],
  ["mathematics", "algebra"],
  ["mathematics", "geometry"],
  ["analysis", "functions"],
  ["analysis", "limit"],
  ["algebra", "vectors"],
  ["geometry", "plane-geometry"],
];

const copy = {
  zh: { chain: "前置知识链", open: "进入知识点 →", planned: "规划中", hover: "把鼠标放到任意节点上", published: "已发布", plannedLegend: "规划中" },
  en: { chain: "Prerequisite chain", open: "Open concept →", planned: "Planned", hover: "Hover over any node", published: "Published", plannedLegend: "Planned" },
};

export function KnowledgeTree({ locale, focus }: { locale: Locale; focus?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(focus ?? null);
  const active = hover ?? pinned;
  const t = copy[locale];

  const highlight = useMemo(() => {
    if (!active) return null;
    const set = new Set(prerequisiteClosure(active));
    set.add(active);
    return set;
  }, [active]);

  const prereqEdges = useMemo(() => {
    const edges: [string, string][] = [];
    for (const c of concepts) for (const p of c.prerequisites) edges.push([p, c.slug]);
    return edges;
  }, []);

  const chain = active ? prerequisiteChain(active) : [];
  const activeConcept = active ? getConcept(active) : undefined;

  function edgeState(a: string, b: string): "on" | "off" | "idle" {
    if (!highlight) return "idle";
    return highlight.has(a) && highlight.has(b) ? "on" : "off";
  }

  return (
    <div>
      <svg viewBox="0 0 1000 720" className="w-full h-auto select-none" role="img" aria-label={t.hover}>
        <defs>
          <marker id="kt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--leo)" />
          </marker>
        </defs>
        {treeEdges.map(([a, b]) => {
          const [x1, y1] = positions[a];
          const [x2, y2] = positions[b];
          const s = edgeState(a, b);
          return (
            <path
              key={`t-${a}-${b}`}
              d={`M ${x1} ${y1 + 14} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2 - 14}`}
              fill="none"
              stroke="var(--rule-2)"
              strokeWidth={1}
              opacity={s === "off" ? 0.25 : 0.9}
            />
          );
        })}
        {prereqEdges.map(([a, b]) => {
          const [x1, y1] = positions[a];
          const [x2, y2] = positions[b];
          const s = edgeState(a, b);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const sx = x1 + ux * 16;
          const sy = y1 + uy * 16;
          const ex = x2 - ux * 18;
          const ey = y2 - uy * 18;
          const mx = (sx + ex) / 2 - uy * Math.min(40, len * 0.15);
          const my = (sy + ey) / 2 + ux * Math.min(40, len * 0.15);
          return (
            <path
              key={`p-${a}-${b}`}
              d={`M ${sx} ${sy} Q ${mx} ${my}, ${ex} ${ey}`}
              fill="none"
              stroke={s === "on" ? "var(--leo)" : "var(--rule-2)"}
              strokeWidth={s === "on" ? 2 : 1}
              opacity={s === "off" ? 0.18 : s === "on" ? 1 : 0.7}
              markerEnd={s === "on" ? "url(#kt-arrow)" : undefined}
              style={{ transition: "opacity 160ms, stroke 160ms" }}
            />
          );
        })}
        {concepts.map((c) => {
          const [x, y] = positions[c.slug];
          const isStructure = c.level === "structure";
          const on = !highlight || highlight.has(c.slug);
          const isActive = active === c.slug;
          const label = c.title[locale];
          const w = Math.max(56, label.length * (/[一-鿿]/.test(label) ? 15 : 8) + 22);
          const published = c.status === "published";
          const node = (
            <g
              transform={`translate(${x}, ${y})`}
              opacity={on ? 1 : 0.22}
              style={{ transition: "opacity 160ms", cursor: published ? "pointer" : "default" }}
              onMouseEnter={() => setHover(c.slug)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setPinned((p) => (p === c.slug ? null : c.slug))}
            >
              <rect
                x={-w / 2}
                y={-14}
                width={w}
                height={28}
                rx={isStructure ? 14 : 3}
                fill={isActive ? "var(--ink)" : isStructure ? "var(--paper-2)" : "var(--paper)"}
                stroke={isActive ? "var(--ink)" : published ? "var(--ink-2)" : "var(--rule-2)"}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray={published || isStructure ? undefined : "3 3"}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isStructure ? 14 : 13}
                fontWeight={isStructure ? 600 : 500}
                fill={isActive ? "var(--paper)" : published ? "var(--ink)" : "var(--muted)"}
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {label}
              </text>
            </g>
          );
          return <g key={c.slug}>{node}</g>;
        })}
      </svg>

      <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-2 text-sm min-h-14">
        <div className="flex items-center gap-4 text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-3 border border-ink-2 rounded-[2px]" />{t.published}</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-3 border border-rule-2 border-dashed rounded-[2px]" />{t.plannedLegend}</span>
        </div>
        {active && activeConcept ? (
          <div className="flex-1 min-w-64">
            <div className="text-muted mb-1">{t.chain}</div>
            <div className="flex flex-wrap items-center gap-1.5 leading-relaxed">
              {chain.map((s, i) => {
                const c = getConcept(s)!;
                const last = i === chain.length - 1;
                return (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <span className={last ? "font-semibold text-ink border border-ink px-1.5 rounded-[3px]" : "text-ink-2"}>{c.title[locale]}</span>
                    {!last && <span className="text-muted">→</span>}
                  </span>
                );
              })}
            </div>
            <div className="mt-1.5 text-muted">
              {activeConcept.summary[locale]}{" "}
              {activeConcept.status === "published" ? (
                <Link href={`/${locale}/concepts/${activeConcept.slug}`} className="text-leo hover:underline">
                  {t.open}
                </Link>
              ) : (
                <span>· {t.planned}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted">{t.hover}</div>
        )}
      </div>
    </div>
  );
}
