"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { getPreset, integrate, presets, type Method } from "@/lib/math/ode";
import { format } from "@/lib/math/linear";
import { tex } from "@/lib/katex";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";

const presetCopy: Record<string, { label: Record<Locale, string>; tex: string }> = {
  exponential: { label: { zh: "指数增长", en: "Exponential growth" }, tex: "y' = k\\,y" },
  logistic: { label: { zh: "Logistic 增长", en: "Logistic growth" }, tex: "y' = r\\,y\\left(1-\\tfrac{y}{K}\\right)" },
  harmonic: { label: { zh: "阻尼振子", en: "Damped oscillator" }, tex: "x'' + 2\\gamma x' + \\omega^2 x = 0" },
  pendulum: { label: { zh: "单摆", en: "Pendulum" }, tex: "\\theta'' + \\gamma\\theta' + \\tfrac{g}{L}\\sin\\theta = 0" },
};

const PRESET_IDS = presets.map((p) => p.id);
const METHOD_SETS = ["euler,rk4", "euler", "rk4", "none"];

/** Entry i of a comma list from the URL, clamped to [min, max]; the default when missing or unreadable. */
function listValue(text: string, i: number, fallback: number, min: number, max: number): number {
  const raw = text ? text.split(",")[i] : undefined;
  const v = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

const copy = {
  zh: {
    equation: "方程",
    init: "初值",
    step: "步长 h",
    method: "方法",
    exact: "精确解",
    euler: "Euler",
    rk4: "RK4",
    steps: "步数",
    errEuler: "Euler 终点误差",
    errRk4: "RK4 终点误差",
    time: "时间序列",
    phase: "相图",
    noExact: "此参数下没有可用的闭式解，只显示数值解。",
  },
  en: {
    equation: "Equation",
    init: "Initial value",
    step: "step h",
    method: "Method",
    exact: "exact",
    euler: "Euler",
    rk4: "RK4",
    steps: "steps",
    errEuler: "Euler error at end",
    errRk4: "RK4 error at end",
    time: "Time series",
    phase: "Phase portrait",
    noExact: "No closed-form solution for these parameters; numerical solutions only.",
  },
};

export function OdeExplorer({ locale, preset: initialPreset = "exponential" }: { locale: Locale; preset?: string }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<HTMLCanvasElement>(null);
  const resizeVersion = useResizeVersion(wrapRef);

  const [presetId, setPresetId] = useUrlState("preset", initialPreset, PRESET_IDS);
  const preset = getPreset(presetId);
  // Parameters and initial values are kept in the URL as comma lists ("" = the preset's defaults),
  // each entry clamped to its slider's range.
  const [paramText, setParamText] = useUrlState("p", "");
  const [y0Text, setY0Text] = useUrlState("y0", "");
  const [h, setH] = useUrlState("h", 0.25, { min: 0.01, max: 1 });
  const [methodText, setMethodText] = useUrlState("methods", "euler,rk4", METHOD_SETS);

  const yRange = preset.bounds.x ?? preset.bounds.y;
  const params = useMemo(
    () => Object.fromEntries(preset.params.map((p, i) => [p.key, listValue(paramText, i, p.value, p.min, p.max)])),
    [preset, paramText],
  );
  const y0 = useMemo(() => preset.defaultY0.map((v, i) => listValue(y0Text, i, v, yRange[0], yRange[1])), [preset, y0Text, yRange]);
  const methods: Record<Method, boolean> = useMemo(() => ({ euler: methodText.includes("euler"), midpoint: false, rk4: methodText.includes("rk4") }), [methodText]);

  function setParams(next: Record<string, number>) {
    const text = preset.params.map((p) => next[p.key]).join(",");
    setParamText(text === preset.params.map((p) => p.value).join(",") ? "" : text);
  }
  function setY0(next: number[]) {
    setY0Text(next.join(",") === preset.defaultY0.join(",") ? "" : next.join(","));
  }
  function setMethods(next: Record<Method, boolean>) {
    setMethodText([next.euler && "euler", next.rk4 && "rk4"].filter(Boolean).join(",") || "none");
  }
  function choosePreset(id: string) {
    setPresetId(id);
    setParamText("");
    setY0Text("");
  }

  const field = useMemo(() => preset.field(params), [preset, params]);
  const exact = useMemo(() => preset.exact?.(params, y0), [preset, params, y0]);

  const runs = useMemo(() => {
    const out: { method: Method; t: number[]; y: number[][] }[] = [];
    for (const m of ["euler", "rk4"] as Method[]) {
      if (!methods[m]) continue;
      const tr = integrate(field, y0, 0, preset.tMax, h, m);
      out.push({ method: m, ...tr });
    }
    return out;
  }, [field, y0, h, methods, preset.tMax]);

  const errors = useMemo(() => {
    if (!exact) return null;
    const ref = exact(preset.tMax)[0];
    const err: Partial<Record<Method, number>> = {};
    for (const r of runs) {
      const last = r.y[r.y.length - 1];
      const tLast = r.t[r.t.length - 1];
      err[r.method] = Math.abs(tLast - preset.tMax) < 1e-9 ? Math.abs(last[0] - ref) : Number.NaN;
    }
    return err;
  }, [exact, runs, preset.tMax]);

  const draw = useCallback(() => {
    const methodColor: Record<Method, string> = { euler: colors.e1, midpoint: colors.accent2, rk4: colors.leo };
    const tc = timeRef.current;
    if (tc) {
      const { width, height, ctx } = fitCanvas(tc, preset.dimension === 2 ? 1.6 : 1.9);
      const p = new Plot(ctx, width, height, [0, preset.tMax], preset.bounds.y);
      ctx.clearRect(0, 0, width, height);
      p.grid(colors.grid, niceStep(preset.tMax), colors.gridStrong);
      p.axes(colors.gridStrong);
      if (exact) p.fn((x) => exact(x)[0], colors.ink, 1.6, [], 600);
      for (const r of runs) {
        const pts = r.t.map((tt, i) => [tt, r.y[i][0]] as const);
        p.polyline(pts, methodColor[r.method], 2);
        if (r.method === "euler" && r.t.length <= 60) r.t.forEach((tt, i) => p.dot(tt, r.y[i][0], methodColor.euler, 2.5));
      }
      p.dot(0, y0[0], colors.ink, 4);
    }
    const pc = phaseRef.current;
    if (pc && preset.dimension === 2 && preset.bounds.x) {
      const { width, height, ctx } = fitCanvas(pc, 1);
      const p = new Plot(ctx, width, height, preset.bounds.x, preset.bounds.y);
      ctx.clearRect(0, 0, width, height);
      p.grid(colors.grid, 1, colors.gridStrong);
      // Direction field.
      ctx.save();
      ctx.strokeStyle = colors.muted;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      const n = 16;
      const [x0, x1] = preset.bounds.x;
      const [yy0, yy1] = preset.bounds.y;
      for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= n; j++) {
          const x = x0 + ((x1 - x0) * i) / n;
          const y = yy0 + ((yy1 - yy0) * j) / n;
          const v = field(0, [x, y]);
          const len = Math.hypot(v[0], v[1]) || 1;
          const s = 0.12 * (x1 - x0) / n * 2;
          const dx = (v[0] / len) * s;
          const dy = (v[1] / len) * s;
          ctx.beginPath();
          ctx.moveTo(p.x(x - dx), p.y(y - dy));
          ctx.lineTo(p.x(x + dx), p.y(y + dy));
          ctx.stroke();
        }
      }
      ctx.restore();
      if (exact) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 800; i++) {
          const e = exact((preset.tMax * i) / 800);
          pts.push([e[0], e[1]]);
        }
        p.polyline(pts, colors.ink, 1.6);
      }
      for (const r of runs) {
        p.polyline(r.y.map((v) => [v[0], v[1]] as const), methodColor[r.method], 2);
      }
      p.dot(y0[0], y0[1], colors.ink, 4);
    }
  }, [colors, runs, exact, preset, field, y0]);

  useEffect(() => {
    draw();
  }, [draw, resizeVersion]);

  const stepCount = Math.ceil(preset.tMax / h - 1e-9);

  return (
    <div ref={wrapRef} className="exp-frame">
      <div className="px-4 py-3 border-b border-rule flex flex-wrap items-center gap-2">
        <span className="exp-control text-muted mr-1">{t.equation}</span>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`btn btn-ghost btn-small ${p.id === presetId ? "border-ink" : ""}`}
            onClick={() => choosePreset(p.id)}
          >
            {presetCopy[p.id].label[locale]}
          </button>
        ))}
        <div className="ml-auto" dangerouslySetInnerHTML={{ __html: tex(presetCopy[preset.id].tex) }} />
      </div>

      <div className={`grid ${preset.dimension === 2 ? "md:grid-cols-[3fr_2fr]" : ""}`}>
        <div>
          <div className="eyebrow px-4 pt-3">{t.time}</div>
          <canvas ref={timeRef} className="exp-canvas" role="img" aria-label={t.time} />
        </div>
        {preset.dimension === 2 && (
          <div className="md:border-l border-rule">
            <div className="eyebrow px-4 pt-3">{t.phase}</div>
            <canvas ref={phaseRef} className="exp-canvas" role="img" aria-label={t.phase} />
          </div>
        )}
      </div>

      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-3">
        {preset.params.map((p) => (
          <label key={p.key} className="exp-control block">
            <div className="flex justify-between">
              <span>{p.label}</span>
              <span className="mono">{params[p.key]?.toFixed(2)}</span>
            </div>
            <input type="range" aria-valuetext={(params[p.key] ?? p.value).toFixed(2)} min={p.min} max={p.max} step={p.step} value={params[p.key] ?? p.value}
              onChange={(e) => setParams({ ...params, [p.key]: Number(e.target.value) })} />
          </label>
        ))}
        {y0.map((v, i) => (
          <label key={i} className="exp-control block">
            <div className="flex justify-between">
              <span>{t.init} {preset.dimension === 2 ? (i === 0 ? "x(0)" : "x′(0)") : "y(0)"}</span>
              <span className="mono">{v.toFixed(2)}</span>
            </div>
            <input type="range" aria-valuetext={v.toFixed(2)} min={preset.bounds.x ? preset.bounds.x[0] : preset.bounds.y[0]} max={preset.bounds.x ? preset.bounds.x[1] : preset.bounds.y[1]} step={0.05} value={v}
              onChange={(e) => setY0(y0.map((w, j) => (j === i ? Number(e.target.value) : w)))} />
          </label>
        ))}
        <label className="exp-control block">
          <div className="flex justify-between">
            <span>{t.step}</span>
            <span className="mono">{h.toFixed(3)} · {stepCount} {t.steps}</span>
          </div>
          <input type="range" aria-valuetext={`${h.toFixed(3)}, ${stepCount} ${t.steps}`} min={0.01} max={1} step={0.005} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
      </div>

      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span className="text-muted">{t.method}</span>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={methods.euler} onChange={(e) => setMethods({ ...methods, euler: e.target.checked })} />
          <span className="inline-block w-3 h-0.5 bg-e1" /> {t.euler}
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={methods.rk4} onChange={(e) => setMethods({ ...methods, rk4: e.target.checked })} />
          <span className="inline-block w-3 h-0.5 bg-leo" /> {t.rk4}
        </label>
        {exact ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 bg-ink" /> {t.exact}
          </span>
        ) : (
          <span className="text-muted">{t.noExact}</span>
        )}
        {errors && (
          <span className="ml-auto flex gap-5">
            {methods.euler && <span>{t.errEuler}: <span className="mono text-ink">{fmtErr(errors.euler)}</span></span>}
            {methods.rk4 && <span>{t.errRk4}: <span className="mono text-ink">{fmtErr(errors.rk4)}</span></span>}
          </span>
        )}
      </div>
    </div>
  );
}

function fmtErr(e: number | undefined): string {
  if (e === undefined || !Number.isFinite(e)) return "—";
  if (e === 0) return "0";
  if (e < 1e-3) return e.toExponential(2);
  return format(e, 4);
}

function niceStep(span: number): number {
  if (span <= 4) return 0.5;
  if (span <= 10) return 1;
  return 2;
}
