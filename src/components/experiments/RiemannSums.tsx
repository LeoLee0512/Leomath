"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { getPreset } from "@/lib/math/functions";
import { format } from "@/lib/math/linear";
import { tex } from "@/lib/katex";
import { useResizeVersion, useThemeColors } from "./useTheme";

const copy = {
  zh: { fn: "函数", n: "分割数 n", a: "下限 a", b: "上限 b", sample: "取点", left: "左端点", right: "右端点", mid: "中点", sum: "Riemann 和", exact: "精确值", err: "误差", hint: "增大 n，三种取点的矩形和都趋于同一个数。控制逼近的是网格变细，不是取点方式。" },
  en: { fn: "Function", n: "subintervals n", a: "lower a", b: "upper b", sample: "sample", left: "left", right: "right", mid: "midpoint", sum: "Riemann sum", exact: "exact", err: "error", hint: "Increase n: all three sampling rules converge to the same number. What drives convergence is the mesh getting finer, not the sampling rule." },
};

const IDS = ["square", "sin", "exp", "ln", "lorentz"];
type Rule = "left" | "right" | "mid";

export function RiemannSums({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [fid, setFid] = useState("square");
  const [n, setN] = useState(8);
  const [a, setA] = useState(0);
  const [b, setB] = useState(2);
  const [rule, setRule] = useState<Rule>("left");
  const p = getPreset(fid);
  const lo = p.domain ? Math.max(p.domain[0], -3) : -3;
  const aa = Math.max(lo, Math.min(a, b));
  const bb = Math.max(aa + 0.05, Math.max(a, b));

  const { sum, exact } = useMemo(() => {
    const dx = (bb - aa) / n;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const xi = rule === "left" ? aa + i * dx : rule === "right" ? aa + (i + 1) * dx : aa + (i + 0.5) * dx;
      s += p.f(xi) * dx;
    }
    const ex = p.F ? p.F(bb) - p.F(aa) : NaN;
    return { sum: s, exact: ex };
  }, [p, n, aa, bb, rule]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, 1.7);
    const plot = new Plot(ctx, width, height, [-3, 3], [-2, 5]);
    ctx.clearRect(0, 0, width, height);
    plot.grid(colors.grid, 1);
    plot.axes(colors.gridStrong);
    const dx = (bb - aa) / n;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x0 = aa + i * dx;
      const xi = rule === "left" ? x0 : rule === "right" ? x0 + dx : x0 + dx / 2;
      const y = p.f(xi);
      const px = plot.x(x0);
      const pw = plot.x(x0 + dx) - px;
      const py = plot.y(Math.max(0, y));
      const ph = Math.abs(plot.y(0) - plot.y(y));
      ctx.fillStyle = colors.leo;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(px, py, pw, ph);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = colors.leo;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    }
    ctx.restore();
    plot.fn((x) => (p.domain && x < p.domain[0] ? NaN : p.f(x)), colors.ink, 2.2);
    plot.polyline([[aa, -0.15], [aa, 0.15]], colors.e1, 2);
    plot.polyline([[bb, -0.15], [bb, 0.15]], colors.e1, 2);
    plot.label("a", aa, 0, colors.e1, -4, 18);
    plot.label("b", bb, 0, colors.e1, -4, 18);
  }, [colors, p, n, aa, bb, rule]);

  useEffect(() => { draw(); }, [draw, resize]);

  return (
    <div ref={wrapRef} className="exp-frame">
      <div className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-2">
        <span className="exp-control text-muted">{t.fn}</span>
        {IDS.map((id) => (
          <button key={id} type="button" className={`btn btn-ghost btn-small ${id === fid ? "border-ink" : ""}`} onClick={() => setFid(id)}>{getPreset(id).label}</button>
        ))}
        <span className="exp-control text-muted ml-auto">{t.sample}</span>
        {(["left", "mid", "right"] as Rule[]).map((r) => (
          <button key={r} type="button" className={`btn btn-ghost btn-small ${r === rule ? "border-ink" : ""}`} onClick={() => setRule(r)}>{t[r]}</button>
        ))}
      </div>
      <canvas ref={canvasRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-3">
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.n}</span><span className="mono">{n}</span></div>
          <input type="range" min={1} max={200} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.a}</span><span className="mono">{aa.toFixed(2)}</span></div>
          <input type="range" className="e1" min={-2.5} max={2.5} step={0.05} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.b}</span><span className="mono">{bb.toFixed(2)}</span></div>
          <input type="range" className="e1" min={-2.5} max={2.5} step={0.05} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: tex(`\\sum_{i=1}^{${n}} f(\\xi_i)\\,\\Delta x`) }} />
        <span><span className="text-muted">{t.sum}</span> <span className="mono text-leo">{format(sum, 5)}</span></span>
        {Number.isFinite(exact) && (<>
          <span><span className="text-muted">{t.exact}</span> <span className="mono text-ink">{format(exact, 5)}</span></span>
          <span><span className="text-muted">{t.err}</span> <span className="mono text-ink">{format(Math.abs(sum - exact), 5)}</span></span>
        </>)}
      </div>
    </div>
  );
}
