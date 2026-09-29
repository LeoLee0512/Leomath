"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { getPreset } from "@/lib/math/functions";
import { format } from "@/lib/math/linear";
import { tex } from "@/lib/katex";
import { useResizeVersion, useThemeColors } from "./useTheme";

const copy = {
  zh: { fn: "函数", x0: "观察点 x₀", h: "增量 h", secant: "割线斜率", tangent: "切线斜率 f′(x₀)", gap: "差", hint: "把 h 调小，割线转向切线。差商 → 导数。", domain: "ln x 只在 x > 0 有定义。" },
  en: { fn: "Function", x0: "point x₀", h: "increment h", secant: "secant slope", tangent: "tangent slope f′(x₀)", gap: "gap", hint: "Shrink h and watch the secant turn into the tangent. Difference quotient → derivative.", domain: "ln x is defined only for x > 0." },
};

const IDS = ["exp", "sin", "square", "cubic", "ln"];

export function SecantTangent({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [fid, setFid] = useState("sin");
  const [x0, setX0] = useState(1);
  const [h, setH] = useState(1.2);
  const p = getPreset(fid);
  const lo = p.domain ? Math.max(p.domain[0], -4) : -4;
  const xa = Math.max(lo, x0);
  const xb = Math.max(lo, xa + h);
  const secant = xb !== xa ? (p.f(xb) - p.f(xa)) / (xb - xa) : p.df(xa);
  const tangent = p.df(xa);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, 1.7);
    const plot = new Plot(ctx, width, height, [-4, 4], [-3, 5]);
    ctx.clearRect(0, 0, width, height);
    plot.grid(colors.grid, 1);
    plot.axes(colors.gridStrong);
    plot.fn((x) => (p.domain && x < p.domain[0] ? NaN : p.f(x)), colors.ink, 2.2);
    // tangent line
    plot.fn((x) => p.f(xa) + tangent * (x - xa), colors.leo, 1.6, [6, 5]);
    // secant line
    plot.fn((x) => p.f(xa) + secant * (x - xa), colors.e1, 2);
    plot.dot(xa, p.f(xa), colors.ink, 4.5);
    plot.dot(xb, p.f(xb), colors.e1, 4.5);
    plot.label("x₀", xa, p.f(xa), colors.ink, 8, -8);
    plot.label("x₀+h", xb, p.f(xb), colors.e1, 8, -8);
  }, [colors, p, xa, xb, secant, tangent]);

  useEffect(() => { draw(); }, [draw, resize]);

  return (
    <div ref={wrapRef} className="exp-frame">
      <div className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-2">
        <span className="exp-control text-muted">{t.fn}</span>
        {IDS.map((id) => (
          <button key={id} type="button" className={`btn btn-ghost btn-small ${id === fid ? "border-ink" : ""}`} onClick={() => setFid(id)}>{getPreset(id).label}</button>
        ))}
      </div>
      <canvas ref={canvasRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.x0}</span><span className="mono">{xa.toFixed(2)}</span></div>
          <input type="range" aria-valuetext={xa.toFixed(2)} min={-3} max={3} step={0.01} value={x0} onChange={(e) => setX0(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.h}</span><span className="mono">{h.toFixed(3)}</span></div>
          <input type="range" aria-valuetext={h.toFixed(3)} className="e1" min={0.001} max={2.5} step={0.001} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: tex(`\\frac{f(x_0+h)-f(x_0)}{h}`) }} />
        <span><span className="text-muted">{t.secant}</span> <span className="mono" style={{ color: colors.e1 }}>{format(secant, 4)}</span></span>
        <span><span className="text-muted">{t.tangent}</span> <span className="mono text-leo">{format(tangent, 4)}</span></span>
        <span><span className="text-muted">{t.gap}</span> <span className="mono text-ink">{format(Math.abs(secant - tangent), 4)}</span></span>
        {fid === "ln" && <span className="text-muted">{t.domain}</span>}
      </div>
    </div>
  );
}
