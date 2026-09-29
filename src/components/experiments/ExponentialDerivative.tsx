"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { format } from "@/lib/math/linear";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";

const copy = {
  zh: {
    base: "底数 a",
    step: "步长 h",
    ratio: "差商 ÷ 原函数",
    fn: "原函数 f(x) = aˣ",
    dq: "差商 [f(x+h) − f(x)] / h",
    match: "两条曲线重合了：这个底数就是 e。",
    near: "很接近了。继续微调 a。",
    hint: "差商曲线始终是 aˣ 的常数倍，这个常数只依赖 a 和 h。",
    setE: "a = e",
  },
  en: {
    base: "base a",
    step: "step h",
    ratio: "difference quotient ÷ function",
    fn: "function f(x) = aˣ",
    dq: "difference quotient [f(x+h) − f(x)] / h",
    match: "The curves coincide: this base is e.",
    near: "Very close. Keep adjusting a.",
    hint: "The difference-quotient curve is always a constant multiple of aˣ; the constant depends only on a and h.",
    setE: "a = e",
  },
};

export function ExponentialDerivative({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const resizeVersion = useResizeVersion(wrapRef);
  const [a, setA] = useUrlState("a", 2, { min: 1.1, max: 4 });
  const [h, setH] = useUrlState("h", 0.5, { min: 0.001, max: 1 });
  const t = copy[locale];
  const quotientHtml = useTex("quotient");

  const ratio = (Math.pow(a, h) - 1) / h; // (a^h − 1)/h → ln a as h → 0
  const closeness = Math.abs(ratio - 1);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height, ctx } = fitCanvas(canvas, compact ? 1.5 : 1.7);
    const p = new Plot(ctx, width, height, [-2.5, 2.5], [-1, 7]);
    ctx.clearRect(0, 0, width, height);
    p.grid(colors.grid, 1);
    p.axes(colors.gridStrong);
    const f = (x: number) => Math.pow(a, x);
    const g = (x: number) => (Math.pow(a, x + h) - Math.pow(a, x)) / h;
    p.fn(f, colors.ink, 2.2);
    p.fn(g, colors.leo, 2.2, closeness < 0.01 ? [] : [7, 5]);
    // Secant illustration at x = 1.
    const x0 = 1;
    p.polyline([[x0, f(x0)], [x0 + h, f(x0 + h)]], colors.e1, 1.5);
    p.dot(x0, f(x0), colors.e1, 3.5);
    p.dot(x0 + h, f(x0 + h), colors.e1, 3.5);
    p.label("f", 1.9, f(1.9), colors.ink, 6, -4, "italic 13px serif");
    p.label(locale === "zh" ? "差商" : "quotient", 1.9, g(1.9), colors.leo, 6, 14, "13px ui-sans-serif");
  }, [a, h, colors, compact, closeness, locale]);

  useEffect(() => {
    draw();
  }, [draw, resizeVersion]);

  const status = closeness < 0.01 ? t.match : closeness < 0.05 ? t.near : "";

  return (
    <div ref={wrapRef} className="exp-frame">
      <canvas ref={canvasRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule px-4 py-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
        <label className="exp-control block">
          <div className="flex justify-between">
            <span>{t.base}</span>
            <span className="mono">{a.toFixed(3)}</span>
          </div>
          <input type="range" aria-valuetext={a.toFixed(3)} min={1.1} max={4} step={0.001} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between">
            <span>{t.step}</span>
            <span className="mono">{h.toFixed(3)}</span>
          </div>
          <input type="range" aria-valuetext={h.toFixed(3)} min={0.001} max={1} step={0.001} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setA(Math.E)}>
          {t.setE}
        </button>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div dangerouslySetInnerHTML={{ __html: quotientHtml }} />
        <div className="exp-control">
          <span className="text-muted">{t.ratio}</span>{" "}
          <span className="mono text-ink">{format(ratio, 4)}</span>
        </div>
        {status && <div className="exp-control text-leo font-medium">{status}</div>}
      </div>
    </div>
  );
}
