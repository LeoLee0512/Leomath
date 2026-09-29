"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { getPreset, taylor } from "@/lib/math/functions";
import { format } from "@/lib/math/linear";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";

const copy = {
  zh: { fn: "函数", order: "阶数 n", center: "展开点 a", maxerr: "窗口 [a−2, a+2] 内最大误差", radius: "收敛半径", hint: "提高阶数，多项式在展开点附近越贴越紧；误差向外增长。ln(1+x) 与 1/(1−x) 在 |x| ≥ 1 处无论多少阶都不收敛。" },
  en: { fn: "Function", order: "order n", center: "centre a", maxerr: "max error on [a−2, a+2]", radius: "radius of convergence", hint: "Raise the order: the polynomial hugs the function ever more tightly near the centre, and the error grows outward. ln(1+x) and 1/(1−x) never converge for |x| ≥ 1, whatever the order." },
};

const IDS = ["sin", "cos", "exp", "ln1p", "geom"];

export function TaylorApprox({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const polyHtml = useTex("poly");
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [fid, setFid] = useUrlState("f", "sin", IDS);
  const [n, setN] = useUrlState("n", 3, { min: 0, max: 14, integer: true });
  const [a, setA] = useUrlState("a", 0, { min: -3, max: 3 });
  const p = getPreset(fid);
  const fixedCentre = p.radius !== undefined && p.radius !== Infinity; // series about 0 only
  const aa = fixedCentre ? 0 : a;

  const maxErr = useMemo(() => {
    let m = 0;
    for (let i = 0; i <= 200; i++) {
      const x = aa - 2 + (4 * i) / 200;
      if (p.domain && x < p.domain[0]) continue;
      const e = Math.abs(taylor(p, n, aa, x) - p.f(x));
      if (Number.isFinite(e)) m = Math.max(m, e);
    }
    return m;
  }, [p, n, aa]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, 1.7);
    const plot = new Plot(ctx, width, height, [-5, 5], [-3, 4]);
    ctx.clearRect(0, 0, width, height);
    plot.grid(colors.grid, 1);
    plot.axes(colors.gridStrong);
    if (fixedCentre && p.radius) {
      ctx.save();
      ctx.fillStyle = colors.accent2;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(plot.x(-p.radius), 0, plot.x(p.radius) - plot.x(-p.radius), height);
      ctx.restore();
    }
    plot.fn((x) => (p.domain && x < p.domain[0] ? NaN : p.f(x)), colors.ink, 2.2, [], 600);
    plot.fn((x) => taylor(p, n, aa, x), colors.leo, 2, [], 600);
    plot.dot(aa, p.f(aa), colors.e1, 4.5);
  }, [colors, p, n, aa, fixedCentre]);

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
          <div className="flex justify-between"><span>{t.order}</span><span className="mono">{n}</span></div>
          <input type="range" min={0} max={14} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.center}</span><span className="mono">{aa.toFixed(2)}</span></div>
          <input type="range" aria-valuetext={aa.toFixed(2)} className="e1" min={-3} max={3} step={0.05} value={aa} disabled={fixedCentre} onChange={(e) => setA(Number(e.target.value))} />
        </label>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: polyHtml }} />
        <span><span className="text-muted">{t.maxerr}</span> <span className="mono text-ink">{maxErr < 1e-3 ? maxErr.toExponential(2) : format(maxErr, 4)}</span></span>
        {fixedCentre && <span><span className="text-muted">{t.radius}</span> <span className="mono text-ink">{p.radius}</span></span>}
      </div>
    </div>
  );
}
