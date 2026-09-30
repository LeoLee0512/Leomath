"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { concepts, getConcept, paths, prerequisiteChain, prerequisiteClosure, type Concept } from "@/content/graph";
import { withBoundary } from "@/components/IslandBoundary";

/** Hand-laid positions in a 1120 × 800 viewBox. */
const positions: Record<string, [number, number]> = {
  mathematics: [560, 44],
  analysis: [230, 140],
  algebra: [600, 140],
  geometry: [850, 140],
  probability: [1005, 140],
  functions: [120, 240],
  limit: [280, 240],
  vectors: [560, 240],
  "plane-geometry": [820, 240],
  "probability-space": [1005, 240],
  "mean-value-theorem": [120, 340],
  derivative: [280, 340],
  "linear-maps": [520, 340],
  "inner-product": [745, 340],
  "conditional-probability": [1005, 340],
  integral: [170, 440],
  "what-is-ode": [400, 440],
  matrices: [560, 440],
  "taylor-series": [95, 540],
  "first-order-ode": [400, 540],
  eigenvalues: [560, 540],
  "random-variables": [1005, 440],
  "expectation-variance": [1005, 540],
  "central-limit-theorem": [1005, 640],
  "group-theory": [820, 540],
  "multivariable-calculus": [125, 640],
  "numerical-ode": [320, 640],
  "second-order-linear-ode": [570, 640],
  "numerical-analysis": [320, 740],
  pde: [570, 740],
};

const treeEdges: [string, string][] = [
  ["mathematics", "analysis"],
  ["mathematics", "algebra"],
  ["mathematics", "geometry"],
  ["mathematics", "probability"],
  ["probability", "probability-space"],
  ["analysis", "functions"],
  ["analysis", "limit"],
  ["algebra", "vectors"],
  ["geometry", "plane-geometry"],
];

const copy = {
  zh: {
    hover: "把鼠标放到任意节点上，它的前置知识会亮起来。",
    tap: "点击一个知识点查看它的前置关系。",
    chain: "前置知识链",
    prereqs: "前置知识",
    none: "无前置知识",
    start: "开始学习 →",
    planned: "规划中",
    published: "已发布",
    building: "正在建设",
    min: (m: number) => `约 ${m} 分钟`,
    legendPub: "已发布",
    legendPlan: "规划中",
    paths: "学习路线",
    inPath: "所属路线",
  },
  en: {
    hover: "Hover over any node and its prerequisites light up.",
    tap: "Tap a concept to see what it builds on.",
    chain: "Prerequisite chain",
    prereqs: "Prerequisites",
    none: "No prerequisites",
    start: "Start learning →",
    planned: "Planned",
    published: "Published",
    building: "In progress",
    min: (m: number) => `${m} min`,
    legendPub: "Published",
    legendPlan: "Planned",
    paths: "Paths",
    inPath: "Part of",
  },
};

export interface KnowledgeTreeProps {
  locale: Locale;
  focus?: string;
  /** Reading minutes per published concept, computed on the server. */
  minutes?: Record<string, number>;
}

function KnowledgeTreeIsland({ locale, focus, minutes = {} }: KnowledgeTreeProps) {
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

  const activeConcept = active ? getConcept(active) : undefined;
  const chain = active ? prerequisiteChain(active) : [];

  function edgeState(a: string, b: string): "on" | "off" | "idle" {
    if (!highlight) return "idle";
    return highlight.has(a) && highlight.has(b) ? "on" : "off";
  }

  const statusLine = (c: Concept) => {
    if (c.level === "structure") return null;
    if (c.status === "published") return minutes[c.slug] ? `${t.published} · ${t.min(minutes[c.slug])}` : t.published;
    return t.planned;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      {/* Desktop: the map. */}
      <div className="hidden md:block">
        {/* role="group", not "img": an image hides its children, and the nodes here are real buttons. */}
        <svg viewBox="0 0 1120 800" className="w-full h-auto select-none" role="group" aria-label={t.hover}>
          <defs>
            <marker id="kt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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
                d={`M ${x1} ${y1 + 18} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2 - 22}`}
                fill="none"
                stroke="var(--rule-2)"
                strokeWidth={1.2}
                opacity={s === "off" ? 0.2 : 1}
                style={{ transition: "opacity 160ms" }}
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
            const sx = x1 + ux * 22;
            const sy = y1 + uy * 22;
            const ex = x2 - ux * 26;
            const ey = y2 - uy * 26;
            const bend = Math.min(40, len * 0.15);
            const mx = (sx + ex) / 2 - uy * bend;
            const my = (sy + ey) / 2 + ux * bend;
            return (
              <path
                key={`p-${a}-${b}`}
                d={`M ${sx} ${sy} Q ${mx} ${my}, ${ex} ${ey}`}
                fill="none"
                stroke={s === "on" ? "var(--leo)" : "var(--grid-strong)"}
                strokeWidth={s === "on" ? 2.4 : 1.3}
                opacity={s === "off" ? 0.15 : 1}
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
            const inPath = Boolean(highlight?.has(c.slug)) && !isActive;
            const label = c.title[locale];
            const sub = statusLine(c);
            const textWidth = [...label].reduce((acc, ch) => acc + (/[\u4e00-\u9fff]/.test(ch) ? 15.5 : /[A-Z]/.test(ch) ? 9.5 : 8), 0);
            const w = Math.max(72, textWidth + 28, (sub?.length ?? 0) * 6.5 + 24);
            const h = isStructure ? 34 : sub ? 46 : 34;
            const published = c.status === "published";
            return (
              <g
                key={c.slug}
                transform={`translate(${x}, ${y})`}
                opacity={on ? 1 : 0.18}
                style={{ transition: "opacity 160ms", cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-pressed={pinned === c.slug}
                aria-label={label}
                onMouseEnter={() => setHover(c.slug)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.slug)}
                onBlur={() => setHover(null)}
                onClick={() => setPinned((p) => (p === c.slug ? null : c.slug))}
                onKeyDown={(e) => {
                  // Keyboard users pin a node with Enter or Space, so the panel stays while they Tab to its link.
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPinned((p) => (p === c.slug ? null : c.slug));
                  }
                }}
              >
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx={isStructure ? h / 2 : 4}
                  fill={isActive ? "var(--ink)" : isStructure ? "var(--paper-2)" : "var(--paper)"}
                  stroke={isActive ? "var(--ink)" : inPath ? "var(--leo)" : published ? "var(--ink-2)" : "var(--rule-2)"}
                  strokeWidth={isActive || inPath ? 1.8 : 1.2}
                  strokeDasharray={published || isStructure ? undefined : "4 3"}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  y={sub ? -8 : 0}
                  fontSize={isStructure ? 15 : 15}
                  fontWeight={600}
                  fill={isActive ? "var(--paper)" : published || isStructure ? "var(--ink)" : "var(--muted)"}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {label}
                </text>
                {sub && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    y={11}
                    fontSize={10.5}
                    fill={isActive ? "var(--paper)" : published ? "var(--leo)" : "var(--muted)"}
                    opacity={isActive ? 0.8 : 1}
                    style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}
                  >
                    {sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex items-center gap-5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-3 border border-ink-2 rounded-[2px]" />{t.legendPub}</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-3 border border-rule-2 border-dashed rounded-[2px]" />{t.legendPlan}</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-leo" />{t.chain}</span>
        </div>
      </div>

      {/* Mobile: the same graph as a navigable list, one chain per path. */}
      <div className="md:hidden space-y-6">
        <p className="text-sm text-muted">{t.tap}</p>
        {paths.map((p) => (
          <div key={p.slug}>
            <p className="eyebrow mb-2">{p.title[locale]}</p>
            <ol className="border-l border-rule-2 ml-2 pl-4 space-y-2">
              {p.concepts.map((s) => {
                const c = getConcept(s)!;
                const isActive = active === s;
                return (
                  <li key={s} className="relative">
                    <span className={`absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full border ${isActive ? "bg-ink border-ink" : "bg-paper border-ink-2"}`} />
                    <button type="button" className="text-left w-full" onClick={() => setPinned((v) => (v === s ? null : s))}>
                      <span className="font-medium">{c.title[locale]}</span>
                      <span className="block text-xs text-leo">{statusLine(c)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        <div>
          <p className="eyebrow mb-2">{t.legendPlan}</p>
          <div className="flex flex-wrap gap-2">
            {concepts.filter((c) => c.status === "planned" && c.level !== "structure").map((c) => (
              <button key={c.slug} type="button" onClick={() => setPinned((v) => (v === c.slug ? null : c.slug))}
                className={`text-xs border border-dashed rounded px-2 py-1 ${active === c.slug ? "border-ink text-ink" : "border-rule-2 text-muted"}`}>
                {c.title[locale]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The panel: what the hovered/selected node is, what it needs, where to start. */}
      <aside className="lg:sticky lg:top-20 border-t lg:border-t-0 lg:border-l border-rule pt-5 lg:pt-0 lg:pl-6 min-h-56">
        {activeConcept && activeConcept.level !== "structure" ? (
          <div>
            <p className="eyebrow">
              {activeConcept.status === "published" ? t.published : t.building}
              {minutes[activeConcept.slug] ? ` · ${t.min(minutes[activeConcept.slug])}` : ""}
            </p>
            <h3 className="display text-2xl font-semibold mt-2">{activeConcept.title[locale]}</h3>
            <p className="mt-2 text-sm text-ink-2 leading-relaxed">{activeConcept.summary[locale]}</p>

            <p className="eyebrow mt-5 mb-1.5">{t.prereqs}</p>
            {activeConcept.prerequisites.length === 0 ? (
              <p className="text-sm text-muted">{t.none}</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {activeConcept.prerequisites.map((s) => {
                  const pc = getConcept(s)!;
                  return (
                    <li key={s}>
                      {pc.status === "published" ? (
                        <a href={`/${locale}/concepts/${s}`} className="text-sm border border-ink-2 rounded-[3px] px-1.5 py-0.5 hover:border-leo hover:text-leo">{pc.title[locale]}</a>
                      ) : (
                        <span className="text-sm border border-dashed border-rule-2 rounded-[3px] px-1.5 py-0.5 text-muted">{pc.title[locale]}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {chain.length > 1 && (
              <>
                <p className="eyebrow mt-5 mb-1.5">{t.chain}</p>
                <p className="text-sm leading-relaxed text-ink-2">
                  {chain.map((s, i) => (
                    <span key={s}>
                      {i > 0 && <span className="text-muted"> → </span>}
                      <span className={i === chain.length - 1 ? "text-ink font-semibold" : ""}>{getConcept(s)!.title[locale]}</span>
                    </span>
                  ))}
                </p>
              </>
            )}

            <div className="mt-6">
              {activeConcept.status === "published" ? (
                <a href={`/${locale}/concepts/${activeConcept.slug}`} className="btn btn-primary btn-small">{t.start}</a>
              ) : (
                <span className="text-sm text-muted">{t.planned}</span>
              )}
            </div>
          </div>
        ) : activeConcept ? (
          <div>
            <h3 className="display text-2xl font-semibold">{activeConcept.title[locale]}</h3>
            <p className="mt-2 text-sm text-ink-2">{activeConcept.summary[locale]}</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink-2 leading-relaxed hidden md:block">{t.hover}</p>
            <p className="eyebrow mt-4 mb-2">{t.paths}</p>
            <ul className="space-y-2">
              {paths.map((p) => (
                <li key={p.slug}>
                  <button type="button" className="text-left text-sm hover:text-leo" onClick={() => setPinned(p.concepts[p.concepts.length - 1])}>
                    <span className="font-medium block">{p.title[locale]}</span>
                    <span className="text-muted text-xs">{p.subtitle[locale]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

/** An error inside the KnowledgeTree shows a message with a reload button instead of removing it from the page. */
export const KnowledgeTree = withBoundary(KnowledgeTreeIsland);
