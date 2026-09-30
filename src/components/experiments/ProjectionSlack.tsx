"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { format, inner, projection, type Mat2, type Vec2 } from "@/lib/math/linear";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";
import { parsePoints, pointsText, useDragHandles } from "./dragHandles";

const ASPECT = 1.4;
const Y = 3.2;
const X = Y * ASPECT;
const BOUND = 4.4;

/** The two inner products on ℝ² the reader can switch between, as Gram matrices. */
const GRAM: Record<"standard" | "weighted", Mat2> = { standard: [1, 0, 0, 1], weighted: [2, 0, 0, 1] };
const KINDS = ["standard", "weighted"] as const;

const DEFAULT: Vec2[] = [[1, 2.5], [3, 1]];

const presets: { id: string; label: Record<Locale, string>; uv: Vec2[]; kind?: (typeof KINDS)[number] }[] = [
  { id: "along", label: { zh: "同向", en: "Same direction" }, uv: [[1.5, 0.5], [3, 1]] },
  { id: "opposite", label: { zh: "反向", en: "Opposite" }, uv: [[-2, -1], [3, 1.5]] },
  { id: "perp", label: { zh: "垂直", en: "Perpendicular" }, uv: [[0, 2.5], [3, 0]] },
  { id: "weighted-perp", label: { zh: "加权下正交", en: "Orthogonal when weighted" }, uv: [[1, 2], [2, -2]], kind: "weighted" },
];

const copy = {
  zh: {
    kind: "内积", standard: "标准 u₁v₁ + u₂v₂", weighted: "加权 2u₁v₁ + u₂v₂",
    uv: "|⟨u,v⟩|", norms: "‖u‖‖v‖", cos: "cos θ", t: "投影系数 t", slack: "差额",
    legendU: "u", legendV: "v", legendP: "投影 tv", legendR: "剩下的 u − tv", legendBall: "单位“圆” ‖x‖ = 1",
    move: "方向键移动", equal: "取等：u、v 线性相关",
    hint: "拖动 u 和 v 的端点。蓝色是 u 在 v 方向上的投影 tv，红色虚线是剩下的 u − tv。下面两根条比较 |⟨u,v⟩| 与 ‖u‖‖v‖。聚焦画布后，方向键移动选中的点。",
  },
  en: {
    kind: "inner product", standard: "standard u₁v₁ + u₂v₂", weighted: "weighted 2u₁v₁ + u₂v₂",
    uv: "|⟨u,v⟩|", norms: "‖u‖‖v‖", cos: "cos θ", t: "projection coefficient t", slack: "slack",
    legendU: "u", legendV: "v", legendP: "projection tv", legendR: "remainder u − tv", legendBall: "unit “circle” ‖x‖ = 1",
    move: "Arrow keys move", equal: "equality: u, v are dependent",
    hint: "Drag the tips of u and v. Blue is the projection tv of u onto the direction of v; the dashed red segment is the remainder u − tv. The two bars below compare |⟨u,v⟩| with ‖u‖‖v‖. With the canvas focused, the arrow keys move the selected point.",
  },
};

export function ProjectionSlack({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const csHtml = useTex("cauchySchwarz");
  const slackHtml = useTex("slack");
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [uvText, setUvText] = useUrlState("uv", pointsText(DEFAULT));
  const [kind, setKind] = useUrlState<(typeof KINDS)[number]>("ip", "standard", KINDS);
  const [u, v] = useMemo(() => parsePoints(uvText, DEFAULT, BOUND), [uvText]);
  const g = GRAM[kind];
  const pr = useMemo(() => projection(g, u, v), [g, u, v]);
  const nu = Math.sqrt(pr.uu);
  const nv = Math.sqrt(pr.vv);
  const bound = nu * nv;
  const equal = pr.slack <= 1e-9 * Math.max(1, pr.uu * pr.vv);

  const drag = useDragHandles({
    canvasRef,
    xRange: [-X, X],
    yRange: [-Y, Y],
    handles: [u, v],
    onDrag: (i, p) => setUvText(pointsText(i === 0 ? [p, v] : [u, p])),
  });

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, ASPECT);
    const plot = new Plot(ctx, width, height, [-X, X], [-Y, Y]);
    ctx.clearRect(0, 0, width, height);
    plot.grid(colors.grid, 1, colors.gridStrong);

    // The unit "circle" of this inner product: gx² + y² = 1 is an ellipse when weighted.
    const ball: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const a = (2 * Math.PI * i) / 120;
      const d: Vec2 = [Math.cos(a), Math.sin(a)];
      const r = 1 / Math.sqrt(inner(g, d, d));
      ball.push([r * d[0], r * d[1]]);
    }
    plot.polyline(ball, colors.muted, 1.2, [3, 4]);

    // The line through v, onto which u is projected.
    if (pr.vv > 0) plot.polyline([[-v[0] * 10, -v[1] * 10], [v[0] * 10, v[1] * 10]], colors.gridStrong, 1, [6, 5]);

    // Right-angle mark where the remainder meets the line, when that is a Euclidean right angle.
    const rn = Math.hypot(pr.r[0], pr.r[1]);
    const vn = Math.hypot(v[0], v[1]);
    if (kind === "standard" && rn > 0.15 && vn > 0) {
      const s = 0.18;
      const a: Vec2 = [(v[0] / vn) * s * Math.sign(pr.t || 1) * -1, (v[1] / vn) * s * Math.sign(pr.t || 1) * -1];
      const b: Vec2 = [(pr.r[0] / rn) * s, (pr.r[1] / rn) * s];
      plot.polyline([[pr.p[0] + a[0], pr.p[1] + a[1]], [pr.p[0] + a[0] + b[0], pr.p[1] + a[1] + b[1]], [pr.p[0] + b[0], pr.p[1] + b[1]]], colors.muted, 1);
    }

    plot.polyline([pr.p, u], colors.e1, 2, [6, 4]);
    if (Math.hypot(pr.p[0], pr.p[1]) > 0.02) plot.arrow([0, 0], pr.p, colors.leo, 5);
    plot.dot(pr.p[0], pr.p[1], colors.leo, 4);
    plot.arrow([0, 0], v, colors.e2, 2.6);
    plot.arrow([0, 0], u, colors.ink, 2.6);
    const bold = "600 13px ui-sans-serif, system-ui";
    plot.label("u", u[0], u[1], colors.ink, 8, -8, bold);
    plot.label("v", v[0], v[1], colors.e2, 8, -8, bold);
    plot.label("tv", pr.p[0], pr.p[1], colors.leo, 8, 16, bold);
    [u, v].forEach((h, i) => {
      plot.dot(h[0], h[1], colors.paper, i === drag.selected ? 8 : 7);
      plot.dot(h[0], h[1], i === 0 ? colors.ink : colors.e2, i === drag.selected ? 6 : 5);
    });
  }, [colors, g, kind, pr, u, v, drag.selected]);

  useEffect(() => { draw(); }, [draw, resize]);

  const f = (x: number, d = 2) => format(x, d).replace(/^-/, "−");
  const scaleMax = Math.max(bound, 1e-9);

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--ink)" label={t.legendU} />
        <LegendItem color="var(--e2)" label={t.legendV} />
        <LegendItem color="var(--leo)" label={t.legendP} />
        <LegendItem color="var(--e1)" dash="6 4" label={t.legendR} />
        <LegendItem color="var(--muted)" dash="3 4" label={t.legendBall} />
      </ul>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="exp-canvas exp-canvas-drag cursor-grab active:cursor-grabbing"
        role="img"
        aria-label={t.hint}
        {...drag.handlers}
      />
      <div className="border-t border-rule px-4 py-3 grid gap-2 exp-control" aria-live="polite">
        {[
          { label: t.uv, value: Math.abs(pr.uv), color: "var(--leo)" },
          { label: t.norms, value: bound, color: "var(--ink-2)" },
        ].map((bar) => (
          <div key={bar.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_3.5rem] items-center gap-3">
            <span className="text-muted mono">{bar.label}</span>
            <span className="h-3 rounded-sm bg-rule overflow-hidden" aria-hidden="true">
              <span className="block h-full rounded-sm" style={{ width: `${(100 * bar.value) / scaleMax}%`, background: bar.color }} />
            </span>
            <span className="mono text-ink text-right">{f(bar.value)}</span>
          </div>
        ))}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
          <span><span className="text-muted">⟨u,v⟩</span> <span className="mono text-ink">{f(pr.uv)}</span></span>
          <span><span className="text-muted">{t.cos}</span> <span className="mono text-ink">{bound > 0 ? f(pr.uv / bound, 3) : "—"}</span></span>
          <span><span className="text-muted">{t.t}</span> <span className="mono text-leo">{f(pr.t, 3)}</span></span>
          <span><span className="text-muted">{t.slack}</span> <span className="mono text-e1">{f(pr.slack)}</span></span>
          {equal && <span className="text-e2">{t.equal}</span>}
        </div>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: csHtml }} />
        <span dangerouslySetInnerHTML={{ __html: slackHtml }} />
      </div>
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2 exp-control">
        <span className="text-muted mr-1">{t.kind}</span>
        {KINDS.map((k) => (
          <button key={k} type="button" className={`btn btn-ghost btn-small ${kind === k ? "border-ink" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {t[k]}
          </button>
        ))}
      </div>
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2 exp-control">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => {
              setUvText(pointsText(p.uv));
              if (p.kind) setKind(p.kind);
            }}
          >
            {p.label[locale]}
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-1.5" role="group" aria-label={t.move}>
          <span className="text-muted">{t.move}</span>
          {["u", "v"].map((name, i) => (
            <button key={name} type="button" className={`btn btn-ghost btn-small ${drag.selected === i ? "border-ink" : ""}`} aria-pressed={drag.selected === i} onClick={() => { drag.setSelected(i); canvasRef.current?.focus(); }}>
              {name}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
