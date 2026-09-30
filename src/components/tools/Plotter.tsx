"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { compile, ExprError, type Compiled } from "@/lib/math/expr";
import { useResizeVersion, useThemeColors } from "../experiments/useTheme";
import { withBoundary } from "@/components/IslandBoundary";

const copy = {
  zh: {
    title: "函数绘图与计算", hint: "输入 x 的表达式；其他字母自动变成可调参数。拖动平移，滚轮缩放。",
    add: "添加曲线", remove: "移除", reset: "重置视图", params: "参数", at: "在 x =", value: "的值",
    calc: "计算器", calcHint: "只含数字与常数的表达式，例如 sqrt(2)*10^3、sin(pi/6)、gamma(5)。",
    errors: { unexpected: "位置 {pos} 处有意外的符号 “{detail}”", "unknown-name": "未知的名字 “{detail}”", arity: "函数 {detail} 的参数个数不对", unclosed: "位置 {pos} 处的括号没有闭合", empty: "表达式为空" } as Record<string, string>,
    notFinite: "结果不是有限数",
  },
  en: {
    title: "Function plotter & calculator", hint: "Type an expression in x; other letters become adjustable parameters. Drag to pan, scroll to zoom.",
    add: "Add curve", remove: "Remove", reset: "Reset view", params: "Parameters", at: "at x =", value: "value",
    calc: "Calculator", calcHint: "Expressions with numbers and constants only, e.g. sqrt(2)*10^3, sin(pi/6), gamma(5).",
    errors: { unexpected: "unexpected “{detail}” at position {pos}", "unknown-name": "unknown name “{detail}”", arity: "wrong number of arguments for {detail}", unclosed: "unclosed bracket at position {pos}", empty: "empty expression" } as Record<string, string>,
    notFinite: "result is not a finite number",
  },
};

function describe(err: unknown, t: (typeof copy)["zh"]): string {
  if (err instanceof ExprError) return (t.errors[err.code] ?? err.code).replace("{pos}", String(err.pos + 1)).replace("{detail}", err.detail);
  return String(err);
}

interface Curve { src: string; compiled?: Compiled; error?: string }

function PlotterIsland({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [srcs, setSrcs] = useState<string[]>(["sin(x) + a*x", "x^2 - 2"]);
  const [params, setParams] = useState<Record<string, number>>({});
  const [view, setView] = useState({ cx: 0, cy: 0, w: 12 });
  const [probe, setProbe] = useState(1);
  const [calcSrc, setCalcSrc] = useState("sqrt(2) * 10^3");

  const curves: Curve[] = useMemo(() => srcs.map((src) => {
    if (!src.trim()) return { src };
    try { return { src, compiled: compile(src) }; } catch (e) { return { src, error: describe(e, t) }; }
  }), [srcs, t]);

  const paramNames = useMemo(() => {
    const names = new Set<string>();
    for (const c of curves) c.compiled?.variables.forEach((v) => v !== "x" && names.add(v));
    return [...names];
  }, [curves]);

  const scope = useMemo(() => Object.fromEntries(paramNames.map((n) => [n, params[n] ?? 1])), [paramNames, params]);
  const palette = useMemo(() => [colors.leo, colors.e1, colors.e2, colors.accent2], [colors]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, 1.6);
    const h = view.w / 1.6;
    const plot = new Plot(ctx, width, height, [view.cx - view.w / 2, view.cx + view.w / 2], [view.cy - h / 2, view.cy + h / 2]);
    ctx.clearRect(0, 0, width, height);
    const step = niceStep(view.w);
    plot.grid(colors.grid, step, colors.gridStrong);
    plot.axes(colors.gridStrong);
    ctx.save();
    ctx.fillStyle = colors.muted;
    ctx.font = "11px ui-monospace, monospace";
    for (let x = Math.ceil(plot.xRange[0] / step) * step; x <= plot.xRange[1]; x += step) if (Math.abs(x) > 1e-9) ctx.fillText(trim(x), plot.x(x) + 3, plot.y(0) - 4);
    for (let y = Math.ceil(plot.yRange[0] / step) * step; y <= plot.yRange[1]; y += step) if (Math.abs(y) > 1e-9) ctx.fillText(trim(y), plot.x(0) + 4, plot.y(y) - 3);
    ctx.restore();
    curves.forEach((cv, i) => {
      if (!cv.compiled) return;
      const f = cv.compiled;
      plot.fn((x) => { try { return f.evaluate({ ...scope, x }); } catch { return NaN; } }, palette[i % palette.length], 2, [], 800);
    });
    curves.forEach((cv, i) => {
      if (!cv.compiled) return;
      try { const y = cv.compiled.evaluate({ ...scope, x: probe }); if (Number.isFinite(y)) plot.dot(probe, y, palette[i % palette.length], 4); } catch {}
    });
  }, [colors, curves, scope, view, probe, palette]);

  useEffect(() => { draw(); }, [draw, resize]);

  // Wheel zoom must be a non-passive listener so the page does not scroll too.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width - 0.5;
      const fy = 0.5 - (e.clientY - rect.top) / rect.height;
      setView((v) => {
        const k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
        const w = Math.min(200, Math.max(0.5, v.w * k));
        const h = v.w / 1.6, h2 = w / 1.6;
        return { cx: v.cx + fx * (v.w - w), cy: v.cy + fy * (h - h2), w };
      });
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);

  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  function onDown(e: React.PointerEvent<HTMLCanvasElement>) { drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy }; e.currentTarget.setPointerCapture(e.pointerId); }
  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - start.x) / rect.width) * view.w;
    const dy = ((e.clientY - start.y) / rect.height) * (view.w / 1.6);
    // Computed now, not inside a state updater: React runs updaters later, by which time the pointer may be
    // up and drag.current null, and a throw during render would unmount the whole tool.
    setView((v) => ({ ...v, cx: start.cx - dx, cy: start.cy + dy }));
  }
  function onUp(e: React.PointerEvent<HTMLCanvasElement>) { drag.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }

  const calc = useMemo(() => {
    if (!calcSrc.trim()) return "";
    try {
      const v = compile(calcSrc).evaluate({});
      return Number.isFinite(v) ? trim(Math.round(v * 1e12) / 1e12) : t.notFinite;
    } catch (e) { return describe(e, t); }
  }, [calcSrc, t]);

  return (
    <section id="plot" className="exp-frame scroll-mt-24">
      <div className="px-4 py-3 border-b border-rule">
        <h2 className="display text-xl font-semibold">{t.title}</h2>
        <p className="text-sm text-muted mt-1">{t.hint}</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_18rem]">
        <canvas ref={canvasRef} className="exp-canvas exp-canvas-drag cursor-move" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="img" aria-label={t.title} />
        <div className="border-t lg:border-t-0 lg:border-l border-rule p-4 space-y-3 text-sm">
          {curves.map((cv, i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-0.5 shrink-0" style={{ background: palette[i % palette.length] }} />
                <input className="field mono text-sm py-1.5" value={cv.src} onChange={(e) => setSrcs(srcs.map((s, j) => (j === i ? e.target.value : s)))} spellCheck={false} aria-label={`f${i + 1}(x)`} />
                {srcs.length > 1 && <button type="button" className="text-muted hover:text-ink" onClick={() => setSrcs(srcs.filter((_, j) => j !== i))} aria-label={t.remove}>×</button>}
              </div>
              {cv.error && <p className="text-xs text-e1 mt-1 pl-5">{cv.error}</p>}
            </div>
          ))}
          <div className="flex gap-2">
            {srcs.length < 4 && <button type="button" className="btn btn-ghost btn-small" onClick={() => setSrcs([...srcs, ""])}>{t.add}</button>}
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setView({ cx: 0, cy: 0, w: 12 })}>{t.reset}</button>
          </div>
          {paramNames.length > 0 && (
            <div className="pt-2 border-t border-rule">
              <p className="eyebrow mb-2">{t.params}</p>
              {paramNames.map((n) => (
                <label key={n} className="exp-control block mb-2">
                  <div className="flex justify-between"><span className="mono">{n}</span><span className="mono">{(params[n] ?? 1).toFixed(2)}</span></div>
                  <input type="range" aria-valuetext={(params[n] ?? 1).toFixed(2)} min={-5} max={5} step={0.01} value={params[n] ?? 1} onChange={(e) => setParams({ ...params, [n]: Number(e.target.value) })} />
                </label>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-rule">
            <label className="exp-control block">
              <div className="flex justify-between"><span>{t.at}</span><span className="mono">{probe.toFixed(2)}</span></div>
              <input type="range" aria-valuetext={probe.toFixed(2)} min={view.cx - view.w / 2} max={view.cx + view.w / 2} step={view.w / 400} value={probe} onChange={(e) => setProbe(Number(e.target.value))} />
            </label>
            <ul className="mono text-xs mt-1 space-y-0.5">
              {curves.map((cv, i) => {
                if (!cv.compiled) return null;
                let y: string;
                try { const v = cv.compiled.evaluate({ ...scope, x: probe }); y = Number.isFinite(v) ? trim(Math.round(v * 1e6) / 1e6) : "—"; } catch { y = "—"; }
                return <li key={i} style={{ color: palette[i % palette.length] }}>f{i + 1}({trim(probe)}) = {y}</li>;
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-rule px-4 py-3">
        <p className="eyebrow mb-2">{t.calc}</p>
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <input className="field mono text-sm" value={calcSrc} onChange={(e) => setCalcSrc(e.target.value)} spellCheck={false} aria-label={t.calc} />
          <div className="mono text-lg text-ink min-w-40">= {calc}</div>
        </div>
        <p className="text-xs text-muted mt-1">{t.calcHint}</p>
      </div>
    </section>
  );
}

function niceStep(w: number): number {
  const raw = w / 8;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
function trim(x: number): string {
  return Number(x.toPrecision(6)).toString();
}

/** An error inside the Plotter shows a message with a reload button instead of removing it from the page. */
export const Plotter = withBoundary(PlotterIsland);
