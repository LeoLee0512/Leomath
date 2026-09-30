"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { coordinates, format, type Vec2 } from "@/lib/math/linear";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";
import { parsePoints, pointsText, useDragHandles } from "./dragHandles";

const ASPECT = 1.4;
const Y = 3.6;
const X = Y * ASPECT;
const BOUND = 5;

const DEFAULT_BASIS: Vec2[] = [[1, 0], [0, 1]];
const DEFAULT_V: Vec2[] = [[1, 2]];

const presets: { id: string; label: Record<Locale, string>; basis: Vec2[] }[] = [
  { id: "standard", label: { zh: "标准基", en: "Standard basis" }, basis: [[1, 0], [0, 1]] },
  { id: "skew", label: { zh: "斜基", en: "Skewed basis" }, basis: [[2, 1], [-1, 1]] },
  { id: "near", label: { zh: "几乎共线", en: "Nearly collinear" }, basis: [[2, 1], [2, 1.25]] },
  { id: "collinear", label: { zh: "共线", en: "Collinear" }, basis: [[2, 1], [-1, -0.5]] },
];

const copy = {
  zh: {
    move: "方向键移动", std: "标准坐标", coords: "在 b₁, b₂ 下的坐标", area: "b₁, b₂ 张成的平行四边形面积",
    notBasis: "b₁, b₂ 共线，不是基。", onLine: "v 在它们张成的直线上：写法有无穷多种", offLine: "v 不在它们张成的直线上：写不出来",
    legendV: "向量 v", legendGrid: "b₁, b₂ 的坐标网格",
    hint: "拖动 b₁、b₂ 和 v 的端点。淡蓝色网格由 b₁、b₂ 张成，v 沿着它走 c₁ 步 b₁、c₂ 步 b₂。聚焦画布后，方向键移动选中的点（按住 Shift 走得更快）。",
  },
  en: {
    move: "Arrow keys move", std: "standard coordinates", coords: "coordinates in b₁, b₂", area: "area of the parallelogram on b₁, b₂",
    notBasis: "b₁, b₂ are collinear: not a basis. ", onLine: "v lies on their line: infinitely many ways to write it", offLine: "v is off their line: it cannot be written at all",
    legendV: "vector v", legendGrid: "coordinate grid of b₁, b₂",
    hint: "Drag the tips of b₁, b₂ and v. The light blue grid is spanned by b₁, b₂; v is reached by c₁ steps of b₁ and c₂ steps of b₂. With the canvas focused, the arrow keys move the selected point (hold Shift for larger steps).",
  },
};

const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
const scale = (c: number, a: Vec2): Vec2 => [c * a[0], c * a[1]];

export function BasisCoordinates({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const eqHtml = useTex("combination");
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [bText, setBText] = useUrlState("b", pointsText(DEFAULT_BASIS));
  const [vText, setVText] = useUrlState("v", pointsText(DEFAULT_V));
  const [b1, b2] = useMemo(() => parsePoints(bText, DEFAULT_BASIS, BOUND), [bText]);
  const [v] = useMemo(() => parsePoints(vText, DEFAULT_V, BOUND), [vText]);
  const c = useMemo(() => coordinates(b1, b2, v), [b1, b2, v]);
  const area = Math.abs(b1[0] * b2[1] - b2[0] * b1[1]);
  // When b₁, b₂ are collinear, is v on their common line?
  const dir = Math.hypot(b1[0], b1[1]) > 1e-9 ? b1 : b2;
  const onLine = Math.abs(dir[0] * v[1] - dir[1] * v[0]) < 1e-6 * Math.max(1, Math.hypot(dir[0], dir[1]) * Math.hypot(v[0], v[1]));

  const handles = useMemo(() => [b1, b2, v], [b1, b2, v]);
  const drag = useDragHandles({
    canvasRef,
    xRange: [-X, X],
    yRange: [-Y, Y],
    handles,
    onDrag: (i, p) => {
      if (i === 2) setVText(pointsText([p]));
      else setBText(pointsText(i === 0 ? [p, b2] : [b1, p]));
    },
  });

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, ASPECT);
    const plot = new Plot(ctx, width, height, [-X, X], [-Y, Y]);
    ctx.clearRect(0, 0, width, height);
    plot.grid(colors.grid, 1, colors.gridStrong);

    const K = 14;
    ctx.save();
    ctx.globalAlpha = 0.5;
    if (c) {
      // The grid of the basis: lines c₁b₁ + s·b₂ and s·b₁ + c₂b₂ for whole c₁, c₂.
      for (let k = -K; k <= K; k++) {
        plot.polyline([add(scale(k, b1), scale(-K, b2)), add(scale(k, b1), scale(K, b2))], colors.leo, 1);
        plot.polyline([add(scale(-K, b1), scale(k, b2)), add(scale(K, b1), scale(k, b2))], colors.leo, 1);
      }
    } else if (Math.hypot(dir[0], dir[1]) > 1e-9) {
      // Not a basis: everything they span is one line.
      plot.polyline([scale(-20, dir), scale(20, dir)], colors.leo, 2.4);
    }
    ctx.restore();

    if (c) {
      // v = c₁b₁ + c₂b₂: walk along b₁, then along b₂.
      const mid = scale(c[0], b1);
      plot.polyline([[0, 0], mid, v], colors.muted, 1.2, [5, 4]);
      plot.arrow([0, 0], mid, colors.e1, 1.6);
      plot.arrow(mid, v, colors.e2, 1.6);
    }
    plot.arrow([0, 0], b1, colors.e1, 3);
    plot.arrow([0, 0], b2, colors.e2, 3);
    plot.arrow([0, 0], v, colors.ink, 2.6);
    const bold = "600 13px ui-sans-serif, system-ui";
    plot.label("b₁", b1[0], b1[1], colors.e1, 8, -8, bold);
    plot.label("b₂", b2[0], b2[1], colors.e2, 8, -8, bold);
    plot.label("v", v[0], v[1], colors.ink, 8, -8, bold);
    handles.forEach((h, i) => {
      const col = i === 0 ? colors.e1 : i === 1 ? colors.e2 : colors.ink;
      plot.dot(h[0], h[1], colors.paper, i === drag.selected ? 8 : 7);
      plot.dot(h[0], h[1], col, i === drag.selected ? 6 : 5);
    });
  }, [colors, b1, b2, v, c, dir, handles, drag.selected]);

  useEffect(() => { draw(); }, [draw, resize]);

  const names = ["b₁", "b₂", "v"];
  const f = (x: number) => format(x, 2).replace(/^-/, "−");

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--e1)" label="b₁" />
        <LegendItem color="var(--e2)" label="b₂" />
        <LegendItem color="var(--ink)" label={t.legendV} />
        <LegendItem color="var(--leo)" label={t.legendGrid} />
      </ul>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="exp-canvas exp-canvas-drag cursor-grab active:cursor-grabbing"
        role="img"
        aria-label={t.hint}
        {...drag.handlers}
      />
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: eqHtml }} />
        <span aria-live="polite" className="flex flex-wrap gap-x-6 gap-y-2">
        <span><span className="text-muted">{t.std}</span> <span className="mono text-ink">({f(v[0])}, {f(v[1])})</span></span>
        {c ? (
          <>
            <span><span className="text-muted">{t.coords}</span> <span className="mono"><span className="text-e1">{f(c[0])}</span>, <span className="text-e2">{f(c[1])}</span></span></span>
            <span><span className="text-muted">{t.area}</span> <span className="mono text-ink">{f(area)}</span></span>
          </>
        ) : (
          <span className="text-e1">{t.notBasis}{onLine ? t.onLine : t.offLine}</span>
        )}
        </span>
      </div>
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2 exp-control">
        {presets.map((p) => {
          const on = pointsText(p.basis) === pointsText([b1, b2]);
          return (
            <button key={p.id} type="button" className={`btn btn-ghost btn-small ${on ? "border-ink" : ""}`} aria-pressed={on} onClick={() => setBText(pointsText(p.basis))}>
              {p.label[locale]}
            </button>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1.5" role="group" aria-label={t.move}>
          <span className="text-muted">{t.move}</span>
          {names.map((name, i) => (
            <button key={name} type="button" className={`btn btn-ghost btn-small ${drag.selected === i ? "border-ink" : ""}`} aria-pressed={drag.selected === i} onClick={() => { drag.setSelected(i); canvasRef.current?.focus(); }}>
              {name}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
