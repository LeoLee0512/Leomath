"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { format, type Vec2 } from "@/lib/math/linear";
import { pairMoments } from "@/lib/math/probability";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";
import { parsePoints, pointsText, useDragHandles } from "./dragHandles";

const ASPECT = 1.4;
const Y = 3.2;
const X = Y * ASPECT;
const BOUND = 4.2;

/** Six equally likely outcomes ω = 1…6 (one roll of a fair die); outcome ω is the point (X(ω), Y(ω)). */
const DEFAULT: Vec2[] = [[-3, -1.5], [-2, 0], [-1, -1], [0.5, 0.5], [1.5, 2], [3, 1]];

const presets: { id: string; label: Record<Locale, string>; points: Vec2[] }[] = [
  { id: "line", label: { zh: "完全线性", en: "On a line" }, points: [[-3, -1], [-2, -0.5], [-1, 0], [1, 1], [2, 1.5], [3, 2]] },
  { id: "negative", label: { zh: "负相关", en: "Negative" }, points: [[-3, 2], [-2, 0.5], [-1, 1.5], [0.5, -0.5], [1.5, -1], [3, -2]] },
  { id: "parabola", label: { zh: "不相关却有关系", en: "Uncorrelated, yet related" }, points: [[-3, 2], [-2, -0.5], [-1, -2], [1, -2], [2, -0.5], [3, 2]] },
  { id: "outlier", label: { zh: "一个离群点", en: "One outlier" }, points: [[-1, 0.5], [-0.5, -1], [0, 1], [0.5, -0.5], [1, 0], [4, 3]] },
];

const copy = {
  zh: {
    legendPoint: "结果 ω（概率各 1/6）", legendMean: "均值 (EX, EY)", legendLine: "最佳直线", legendPos: "乘积 > 0", legendNeg: "乘积 < 0",
    legendX: "X − EX", legendY: "Y − EY", legendProj: "投影", legendSum: "和 (X+Y) − E(X+Y)",
    scatter: "散点：每个结果 ω 是一个点 (X(ω), Y(ω))", vectors: "向量：减去均值后的 X 与 Y",
    undefined: "有一个方差为 0：ρ 没有定义",
    move: "方向键移动",
    hint: "拖动六个点。每个点是掷一次骰子的一个结果，概率都是 1/6。左图的矩形从均值点连到各个点，面积的平均（蓝正红负）就是协方差；右图把减去均值后的 X、Y 画成两个向量，ρ 是它们夹角的余弦。聚焦画布后，方向键移动选中的点。",
  },
  en: {
    legendPoint: "outcome ω (probability 1/6 each)", legendMean: "mean (EX, EY)", legendLine: "best line", legendPos: "product > 0", legendNeg: "product < 0",
    legendX: "X − EX", legendY: "Y − EY", legendProj: "projection", legendSum: "sum (X+Y) − E(X+Y)",
    scatter: "Scatter: each outcome ω is a point (X(ω), Y(ω))", vectors: "Vectors: X and Y with their means removed",
    undefined: "one variance is 0: ρ is undefined",
    move: "Arrow keys move",
    hint: "Drag the six points. Each is one outcome of a die roll, with probability 1/6. On the left, rectangles join the mean to each point; their average signed area (blue positive, red negative) is the covariance. On the right, X and Y with their means removed are drawn as two vectors, and ρ is the cosine of the angle between them. With the canvas focused, the arrow keys move the selected point.",
  },
};

export function CorrelationAngle({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const covHtml = useTex("covariance");
  const rhoHtml = useTex("correlation");
  const sumHtml = useTex("sum");
  const wrapRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<HTMLCanvasElement>(null);
  const vectorRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [text, setText] = useUrlState("pts", pointsText(DEFAULT));
  const points = useMemo(() => parsePoints(text, DEFAULT, BOUND), [text]);
  const m = useMemo(() => pairMoments(points), [points]);
  const sx = Math.sqrt(m.varX);
  const sy = Math.sqrt(m.varY);
  const defined = Number.isFinite(m.rho);
  const theta = defined ? Math.acos(m.rho) : NaN;

  const drag = useDragHandles({
    canvasRef: scatterRef,
    xRange: [-X, X],
    yRange: [-Y, Y],
    handles: points,
    onDrag: (i, p) => setText(pointsText(points.map((q, j) => (j === i ? p : q)))),
  });

  const drawScatter = useCallback(() => {
    const el = scatterRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, ASPECT);
    const plot = new Plot(ctx, width, height, [-X, X], [-Y, Y]);
    ctx.clearRect(0, 0, width, height);
    plot.grid(colors.grid, 1, colors.gridStrong);

    // Each point's rectangle against the mean: its signed area is (x − EX)(y − EY), and Cov is their average.
    ctx.save();
    ctx.globalAlpha = 0.13;
    for (const [x, y] of points) {
      const s = (x - m.ex) * (y - m.ey);
      if (Math.abs(s) < 1e-9) continue;
      ctx.fillStyle = s > 0 ? colors.leo : colors.e1;
      const x0 = plot.x(Math.min(x, m.ex)), x1 = plot.x(Math.max(x, m.ex));
      const y0 = plot.y(Math.max(y, m.ey)), y1 = plot.y(Math.min(y, m.ey));
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    ctx.restore();

    plot.polyline([[m.ex, -Y], [m.ex, Y]], colors.muted, 1, [4, 4]);
    plot.polyline([[-X, m.ey], [X, m.ey]], colors.muted, 1, [4, 4]);
    if (Number.isFinite(m.slope)) plot.fn((x) => m.ey + m.slope * (x - m.ex), colors.e2, 2, [], 2);

    const bold = "600 12px ui-sans-serif, system-ui";
    points.forEach(([x, y], i) => {
      plot.dot(x, y, colors.paper, i === drag.selected ? 8 : 7);
      plot.dot(x, y, colors.ink, i === drag.selected ? 6 : 5);
      plot.label(String(i + 1), x, y, colors.ink2, 7, -7, bold);
    });
    // The mean as a cross, drawn last so it stays visible.
    const cx = plot.x(m.ex), cy = plot.y(m.ey);
    ctx.save();
    ctx.strokeStyle = colors.e1;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 7); ctx.lineTo(cx + 7, cy + 7);
    ctx.moveTo(cx - 7, cy + 7); ctx.lineTo(cx + 7, cy - 7);
    ctx.stroke();
    ctx.restore();
  }, [colors, points, m, drag.selected]);

  const drawVectors = useCallback(() => {
    const el = vectorRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, ASPECT);
    const plot = new Plot(ctx, width, height, [-X, X], [-Y, Y]);
    ctx.clearRect(0, 0, width, height);
    if (!defined) return;

    // In the plane the two centred vectors span: X − EX along the horizontal, Y − EY at the angle θ above it.
    // Both lie in the upper half-plane, so the origin sits near the bottom and the picture is scaled to fill the panel.
    const c = Math.cos(theta), s = Math.sin(theta);
    const left = Math.max(0, -sy * c);
    const right = Math.max(sx, sx + sy * c);
    const k = Math.min((2 * X - 1) / (left + right), (2 * Y - 1.3) / Math.max(sy * s, 1e-9));
    const o: Vec2 = [-X + 0.5 + left * k, -Y + 0.65];
    const at = (x: number, y: number): Vec2 => [o[0] + x * k, o[1] + y * k];
    const u = at(sx, 0);
    const v = at(sy * c, sy * s);
    const p = at(sy * c, 0);
    const w = at(sx + sy * c, sy * s);

    plot.polyline([[-X, o[1]], [X, o[1]]], colors.gridStrong, 1, [6, 5]);
    plot.polyline([u, w, v], colors.muted, 1, [3, 4]);
    plot.polyline([v, p], colors.muted, 1.2, [6, 4]);
    if (Math.hypot(w[0] - o[0], w[1] - o[1]) > 0.05) plot.arrow(o, w, colors.accent2, 2);
    if (Math.abs(p[0] - o[0]) > 0.05) plot.arrow(o, p, colors.e2, 4);

    // The angle θ between the two vectors.
    const r = Math.min(0.6, 0.45 * k * Math.min(sx, sy));
    const arc: [number, number][] = [];
    for (let i = 0; i <= 40; i++) arc.push([o[0] + r * Math.cos((theta * i) / 40), o[1] + r * Math.sin((theta * i) / 40)]);
    plot.polyline(arc, colors.ink2, 1.2);

    plot.arrow(o, u, colors.ink, 2.6);
    plot.arrow(o, v, colors.leo, 2.6);
    const bold = "600 13px ui-sans-serif, system-ui";
    plot.label("X", u[0], u[1], colors.ink, 6, -8, bold);
    plot.label("Y", v[0], v[1], colors.leo, 6, -8, bold);
    plot.label("θ", o[0] + r * Math.cos(theta / 2), o[1] + r * Math.sin(theta / 2), colors.ink2, 5, -5, bold);
  }, [colors, defined, sx, sy, theta]);

  useEffect(() => { drawScatter(); drawVectors(); }, [drawScatter, drawVectors, resize]);

  const f = (x: number, d = 2) => (Number.isFinite(x) ? format(x, d).replace(/^-/, "−") : "—");
  const sub = (base: string, i: string) => <>{base}<sub>{i}</sub></>;
  const rows: { key: string; label: ReactNode; value: string; color?: string }[] = [
    { key: "ex", label: "EX", value: f(m.ex) }, { key: "ey", label: "EY", value: f(m.ey) },
    { key: "sx", label: sub("σ", "X"), value: f(sx) }, { key: "sy", label: sub("σ", "Y"), value: f(sy) },
    { key: "cov", label: "Cov(X,Y)", value: f(m.cov), color: m.cov > 1e-9 ? "text-leo" : m.cov < -1e-9 ? "text-e1" : undefined },
    { key: "rho", label: "ρ = cos θ", value: f(m.rho, 3), color: "text-ink" },
    { key: "theta", label: "θ", value: defined ? `${f((theta * 180) / Math.PI, 1)}°` : "—" },
    { key: "sum", label: "Var(X+Y)", value: f(m.varSum) },
  ];

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--ink)" dot label={t.legendPoint} />
        <LegendItem color="var(--e1)" label={t.legendMean} />
        <LegendItem color="var(--e2)" label={t.legendLine} />
        <LegendItem color="var(--leo)" square label={t.legendPos} />
        <LegendItem color="var(--e1)" square label={t.legendNeg} />
      </ul>
      <div className="grid md:grid-cols-2">
        <div>
          <p className="px-4 pt-2 text-xs text-muted">{t.scatter}</p>
          <canvas
            ref={scatterRef}
            tabIndex={0}
            className="exp-canvas exp-canvas-drag cursor-grab active:cursor-grabbing"
            role="img"
            aria-label={t.hint}
            {...drag.handlers}
          />
        </div>
        <div className="border-t md:border-t-0 md:border-l border-rule">
          <p className="px-4 pt-2 text-xs text-muted">{t.vectors}</p>
          <canvas ref={vectorRef} className="exp-canvas" role="img" aria-label={t.vectors} />
          <ul className="px-4 pb-2 flex flex-wrap items-center gap-x-4 gap-y-1 exp-control">
            <LegendItem color="var(--ink)" label={t.legendX} />
            <LegendItem color="var(--leo)" label={t.legendY} />
            <LegendItem color="var(--e2)" label={t.legendProj} />
            <LegendItem color="var(--accent-2)" label={t.legendSum} />
          </ul>
        </div>
      </div>
      <div className="border-t border-rule px-4 py-3 exp-control" aria-live="polite">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
          {rows.map((r) => (
            <div key={r.key} className="flex justify-between gap-2">
              <dt className="text-muted mono">{r.label}</dt>
              <dd className={`mono ${r.color ?? "text-ink-2"}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        {!defined && <p className="mt-1 text-e1">{t.undefined}</p>}
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: covHtml }} />
        <span dangerouslySetInnerHTML={{ __html: rhoHtml }} />
        <span dangerouslySetInnerHTML={{ __html: sumHtml }} />
      </div>
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2 exp-control">
        {presets.map((p) => (
          <button key={p.id} type="button" className="btn btn-ghost btn-small" onClick={() => setText(pointsText(p.points))}>
            {p.label[locale]}
          </button>
        ))}
        <span className="ml-auto inline-flex flex-wrap items-center gap-1.5" role="group" aria-label={t.move}>
          <span className="text-muted">{t.move}</span>
          {points.map((_, i) => (
            <button key={i} type="button" className={`btn btn-ghost btn-small ${drag.selected === i ? "border-ink" : ""}`} aria-pressed={drag.selected === i} onClick={() => { drag.setSelected(i); scatterRef.current?.focus(); }}>
              {i + 1}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
