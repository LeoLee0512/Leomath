"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { apply, det, eigen, format, fromColumns, type Mat2, type Vec2 } from "@/lib/math/linear";
import { tex } from "@/lib/katex";
import { useResizeVersion, useThemeColors } from "./useTheme";

const RANGE = 3.2;
const GRID_EXTENT = 8;

const presets: { id: string; label: Record<Locale, string>; m: Mat2 }[] = [
  { id: "identity", label: { zh: "单位", en: "Identity" }, m: [1, 0, 0, 1] },
  { id: "scale", label: { zh: "拉伸", en: "Stretch" }, m: [1.6, 0, 0, 0.7] },
  { id: "shear", label: { zh: "剪切", en: "Shear" }, m: [1, 1, 0, 1] },
  { id: "rotate", label: { zh: "旋转", en: "Rotate" }, m: [Math.cos(Math.PI / 5), -Math.sin(Math.PI / 5), Math.sin(Math.PI / 5), Math.cos(Math.PI / 5)] },
  { id: "reflect", label: { zh: "翻转", en: "Reflect" }, m: [0, 1, 1, 0] },
  { id: "project", label: { zh: "压扁", en: "Collapse" }, m: [1, 1, 0.5, 0.5] },
];

const GUIDE_KEY = "leomath_lt_guide_done";
const noopSubscribe = () => () => {};
const readGuideDone = () => {
  try {
    return localStorage.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
};

const copy = {
  zh: {
    guide: [
      "① 拖动红色的 e₁ 箭头端点。",
      "② 看看整个网格发生了什么：所有直线还是直线，原点没有动。",
      "③ 现在拖动绿色的 e₂。",
      "矩阵 A 的两列，就是 e₁ 和 e₂ 现在的位置。这就是线性变换。",
    ],
    det: "行列式（有向面积）",
    eigen: "特征值",
    eigenComplex: "复数：没有方向被保持，变换含旋转",
    showEigen: "显示特征向量",
    reset: "重置",
    drag: "拖动 e₁、e₂ 的箭头端点",
  },
  en: {
    guide: [
      "① Drag the tip of the red arrow e₁.",
      "② Look at what happened to the whole grid: lines stayed straight, the origin did not move.",
      "③ Now drag the green e₂.",
      "The two columns of A are where e₁ and e₂ are now. That is a linear transformation.",
    ],
    det: "Determinant (signed area)",
    eigen: "Eigenvalues",
    eigenComplex: "complex: no direction is preserved; the map rotates",
    showEigen: "Show eigenvectors",
    reset: "Reset",
    drag: "Drag the tips of e₁ and e₂",
  },
};

export interface LinearTransformProps {
  locale: Locale;
  /** Compact mode is used in the home hero: fewer controls, no eigenvector toggle. */
  compact?: boolean;
  initial?: Mat2;
  onChange?: (m: Mat2) => void;
}

export function LinearTransform({ locale, compact = false, initial = [1, 0, 0, 1], onChange }: LinearTransformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const resizeVersion = useResizeVersion(wrapRef);
  const [m, setM] = useState<Mat2>(initial);
  const [showEigen, setShowEigen] = useState(!compact);
  // Zero-cost onboarding: 0 = drag e1, 1 = look at the grid, 2 = drag e2, 3 = done.
  const [guideState, setGuide] = useState<0 | 1 | 2 | 3>(compact ? 0 : 3);
  const guideDone = useSyncExternalStore(noopSubscribe, readGuideDone, () => false);
  const guide: 0 | 1 | 2 | 3 = guideDone ? 3 : guideState;
  const guideTimer = useRef<number | null>(null);
  const dragStart = useRef<Vec2 | null>(null);
  const dragging = useRef<0 | 1 | null>(null);
  const animRef = useRef<number | null>(null);
  const t = copy[locale];

  function finishGuide() {
    setGuide(3);
    try {
      localStorage.setItem(GUIDE_KEY, "1");
    } catch {}
  }

  const [e1, e2] = useMemo(() => [[m[0], m[2]] as Vec2, [m[1], m[3]] as Vec2], [m]);
  const d = det(m);
  const eig = useMemo(() => eigen(m), [m]);

  useEffect(() => {
    onChange?.(m);
  }, [m, onChange]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height, ctx } = fitCanvas(canvas, 1);
    const p = new Plot(ctx, width, height, [-RANGE, RANGE], [-RANGE, RANGE]);
    ctx.clearRect(0, 0, width, height);

    // Original grid, faint.
    p.grid(colors.grid, 1);

    // Transformed grid: lines map to lines, so mapping endpoints is exact.
    ctx.save();
    for (let k = -GRID_EXTENT; k <= GRID_EXTENT; k++) {
      const isAxis = k === 0;
      const color = isAxis ? colors.ink2 : colors.leo;
      const alpha = isAxis ? 0.9 : 0.45;
      ctx.globalAlpha = alpha;
      p.polyline([apply(m, [k, -GRID_EXTENT]), apply(m, [k, GRID_EXTENT])], color, isAxis ? 1.4 : 1);
      p.polyline([apply(m, [-GRID_EXTENT, k]), apply(m, [GRID_EXTENT, k])], color, isAxis ? 1.4 : 1);
    }
    ctx.restore();

    // Image of the unit square.
    const corners: Vec2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const sq: Vec2[] = corners.map((v) => apply(m, v));
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = d >= 0 ? colors.leo : colors.e1;
    ctx.beginPath();
    sq.forEach((v, i) => (i === 0 ? ctx.moveTo(p.x(v[0]), p.y(v[1])) : ctx.lineTo(p.x(v[0]), p.y(v[1]))));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Eigenvectors.
    if (showEigen && !eig.complex && eig.vectors && eig.values) {
      eig.vectors.forEach((v, i) => {
        const lambda = eig.values![i];
        if (Math.abs(lambda) < 1e-9) return;
        p.polyline([[-v[0] * 10, -v[1] * 10], [v[0] * 10, v[1] * 10]], colors.accent2, 1.2, [6, 5]);
        p.label(`λ=${format(lambda)}`, v[0] * 2.2, v[1] * 2.2, colors.accent2, 4, -4);
      });
    }

    // Basis vectors.
    p.arrow([0, 0], e1, colors.e1, 3);
    p.arrow([0, 0], e2, colors.e2, 3);
    p.label("e₁", e1[0], e1[1], colors.e1, 8, -8, "600 13px ui-sans-serif, system-ui");
    p.label("e₂", e2[0], e2[1], colors.e2, 8, -8, "600 13px ui-sans-serif, system-ui");
    // Drag handles.
    p.dot(e1[0], e1[1], colors.paper, 7);
    p.dot(e1[0], e1[1], colors.e1, 5);
    p.dot(e2[0], e2[1], colors.paper, 7);
    p.dot(e2[0], e2[1], colors.e2, 5);
  }, [colors, m, e1, e2, d, eig, showEigen]);

  useEffect(() => {
    draw();
  }, [draw, resizeVersion]);

  // Pointer interaction.
  function toMath(ev: React.PointerEvent<HTMLCanvasElement>): Vec2 {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * 2 * RANGE - RANGE;
    const py = RANGE - ((ev.clientY - rect.top) / rect.height) * 2 * RANGE;
    return [px, py];
  }
  function onDown(ev: React.PointerEvent<HTMLCanvasElement>) {
    const [x, y] = toMath(ev);
    const d1 = Math.hypot(x - e1[0], y - e1[1]);
    const d2 = Math.hypot(x - e2[0], y - e2[1]);
    const grab = 0.45;
    if (Math.min(d1, d2) > grab) return;
    dragging.current = d1 <= d2 ? 0 : 1;
    dragStart.current = dragging.current === 0 ? e1 : e2;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    ev.currentTarget.setPointerCapture(ev.pointerId);
  }
  function onMove(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (dragging.current === null) return;
    const [x, y] = toMath(ev);
    const snapped: Vec2 = [snap(x), snap(y)];
    setM((prev) => {
      const [c1, c2] = [[prev[0], prev[2]] as Vec2, [prev[1], prev[3]] as Vec2];
      return dragging.current === 0 ? fromColumns(snapped, c2) : fromColumns(c1, snapped);
    });
  }
  function onUp(ev: React.PointerEvent<HTMLCanvasElement>) {
    const which = dragging.current;
    const from = dragStart.current;
    dragging.current = null;
    dragStart.current = null;
    ev.currentTarget.releasePointerCapture(ev.pointerId);
    if (guide === 3 || which === null || !from) return;
    const now = which === 0 ? e1 : e2;
    const moved = Math.hypot(now[0] - from[0], now[1] - from[1]) > 0.25;
    if (!moved) return;
    if (which === 0 && guide === 0) {
      setGuide(1);
      guideTimer.current = window.setTimeout(() => setGuide((g) => (g === 1 ? 2 : g)), 2600);
    } else if (which === 1 && guide >= 1) {
      if (guideTimer.current) clearTimeout(guideTimer.current);
      finishGuide();
    }
  }

  function animateTo(target: Mat2) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = m;
    let t0: number | null = null;
    const dur = 450;
    const step = (now: number) => {
      if (t0 === null) t0 = now;
      const u = Math.min(1, (now - t0) / dur);
      const s = u * u * (3 - 2 * u); // smoothstep
      setM(start.map((v, i) => v + (target[i] - v) * s) as unknown as Mat2);
      if (u < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }

  const c1 = `\\textcolor{${colors.e1}}{`;
  const c2 = `\\textcolor{${colors.e2}}{`;
  const matrixTex = `A=\\begin{pmatrix}${c1}${format(m[0])}}&${c2}${format(m[1])}}\\\\${c1}${format(m[2])}}&${c2}${format(m[3])}}\\end{pmatrix}`;
  const showControls = !compact || guide === 3;

  return (
    <div ref={wrapRef} className="exp-frame">
      {compact && (
        <div className="px-4 py-2.5 border-b border-rule text-sm min-h-10 flex items-center" aria-live="polite">
          <span className={guide === 3 ? "text-ink-2" : "text-ink font-medium"}>{t.guide[guide]}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="exp-canvas cursor-grab active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label={t.drag}
        role="img"
      />
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="text-lg" dangerouslySetInnerHTML={{ __html: tex(matrixTex) }} />
        {showControls && (
          <div className="exp-control">
            <span className="text-muted">{t.det}</span>{" "}
            <span className="mono text-ink">{format(d)}</span>
          </div>
        )}
        {!compact && (
          <div className="exp-control">
            <span className="text-muted">{t.eigen}</span>{" "}
            {eig.complex ? (
              <span className="mono text-ink">
                {format(eig.re!)} ± {format(eig.im!)}i <span className="text-muted">({t.eigenComplex})</span>
              </span>
            ) : (
              <span className="mono text-ink">
                {format(eig.values![0])}, {format(eig.values![1])}
              </span>
            )}
          </div>
        )}
      </div>
      {showControls && (
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2">
        {presets.map((pr) => (
          <button key={pr.id} type="button" className="btn btn-ghost btn-small" onClick={() => animateTo(pr.m)}>
            {pr.label[locale]}
          </button>
        ))}
        {!compact && (
          <label className="exp-control ml-auto inline-flex items-center gap-2">
            <input type="checkbox" checked={showEigen} onChange={(e) => setShowEigen(e.target.checked)} />
            {t.showEigen}
          </label>
        )}
      </div>
      )}
    </div>
  );
}

function snap(v: number): number {
  const r = Math.round(v * 2) / 2;
  return Math.abs(v - r) < 0.08 ? r : Math.round(v * 100) / 100;
}
