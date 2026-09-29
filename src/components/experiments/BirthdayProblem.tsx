"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { birthdayBound, birthdayExact, pairs, sameAsMine, sampleBirthdays, sharedDays } from "@/lib/math/probability";
import { format } from "@/lib/math/linear";
import { tex } from "@/lib/katex";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { LegendItem } from "./Legend";

const copy = {
  zh: {
    n: "人数 n", pairs: "对数", exact: "精确值", bound: "指数下界", mine: "有人和第一个人同一天",
    run1: "模拟 1 个班", run100: "模拟 100 个班", reset: "清零",
    classes: "已模拟班级", hits: "有人同一天", freq: "频率",
    last: (n: number, k: number) => (k === 0 ? `上一个班：${n} 人，没有人同一天生日` : `上一个班：${n} 人，${k} 个日子上有人撞上`),
    empty: "点“模拟”，随机生成一个班的生日",
    hint: "改变人数，逐个班级模拟，看频率如何走向公式给出的概率。",
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    legendExact: "至少两人同一天", legendBound: "指数下界", legendMine: "有人和第一个人同一天", legendFreq: "模拟频率",
  },
  en: {
    n: "people n", pairs: "pairs", exact: "exact", bound: "exponential bound", mine: "someone shares the first person's day",
    run1: "Simulate 1 class", run100: "Simulate 100 classes", reset: "Reset",
    classes: "classes simulated", hits: "with a shared day", freq: "frequency",
    last: (n: number, k: number) => (k === 0 ? `Last class: ${n} people, no shared birthday` : `Last class: ${n} people, ${k} day${k > 1 ? "s" : ""} shared`),
    empty: "Press “Simulate” to draw one class's birthdays",
    hint: "Change the group size, simulate class after class, and watch the frequency approach the formula.",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    legendExact: "some two share a day", legendBound: "exponential bound", legendMine: "someone shares the first person's day", legendFreq: "simulated frequency",
  },
};

const N_MAX = 80;
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

export function BirthdayProblem({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const yearRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [n, setN] = useState(23);
  const [trials, setTrials] = useState(0);
  const [hits, setHits] = useState(0);
  const [last, setLast] = useState<number[] | null>(null);

  const exact = birthdayExact(n);
  const bound = birthdayBound(n);
  const mine = sameAsMine(n);
  const freq = trials > 0 ? hits / trials : null;
  const shared = useMemo(() => (last ? sharedDays(last) : new Set<number>()), [last]);

  const changeN = (v: number) => {
    setN(v);
    setTrials(0);
    setHits(0);
    setLast(null);
  };

  const simulate = (classes: number) => {
    let h = 0;
    let days: number[] = [];
    for (let i = 0; i < classes; i++) {
      days = sampleBirthdays(n);
      if (sharedDays(days).size > 0) h++;
    }
    setTrials((x) => x + classes);
    setHits((x) => x + h);
    setLast(days);
  };

  const drawCurve = useCallback(() => {
    const c = curveRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, 1.9);
    const plot = new Plot(ctx, width, height, [-9, N_MAX + 2], [-0.08, 1.08]);
    ctx.clearRect(0, 0, width, height);
    const font = "11px ui-sans-serif, system-ui";
    // grid: every 10 people, quarters of probability
    ctx.save();
    ctx.lineWidth = 1;
    for (let k = 0; k <= N_MAX; k += 10) {
      ctx.strokeStyle = k === 0 ? colors.gridStrong : colors.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x(k), plot.y(0));
      ctx.lineTo(plot.x(k), plot.y(1));
      ctx.stroke();
      if (k > 0) plot.label(String(k), k, 0, colors.muted, -6, 16, font);
    }
    for (const q of [0, 0.25, 0.5, 0.75, 1]) {
      ctx.strokeStyle = q === 0 ? colors.gridStrong : colors.grid;
      ctx.setLineDash(q === 0.5 ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(plot.x(0), plot.y(q));
      ctx.lineTo(plot.x(N_MAX), plot.y(q));
      ctx.stroke();
      plot.label(String(q), 0, q, colors.muted, -30, 4, font);
    }
    ctx.restore();

    const series = (f: (k: number) => number) => Array.from({ length: N_MAX }, (_, i) => [i + 1, f(i + 1)] as const);
    plot.polyline(series(sameAsMine), colors.accent2, 1.6, [2, 4]);
    plot.polyline(series(birthdayBound), colors.leo, 1.6, [6, 5]);
    plot.polyline(series(birthdayExact), colors.ink, 2.2);

    // current n
    ctx.save();
    ctx.strokeStyle = colors.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.x(n), plot.y(0));
    ctx.lineTo(plot.x(n), plot.y(1));
    ctx.stroke();
    ctx.restore();
    plot.dot(n, mine, colors.accent2, 3.5);
    plot.dot(n, exact, colors.ink, 4.5);
    if (freq !== null) {
      plot.dot(n, freq, colors.e1, 5);
      plot.label(`${format(freq, 3)}`, n, freq, colors.e1, 9, freq > exact ? -6 : 14, font);
    }
  }, [colors, n, exact, mine, freq]);

  const drawYear = useCallback(() => {
    const c = yearRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, Math.max(4, (c.clientWidth || 600) / 100));
    ctx.clearRect(0, 0, width, height);
    const left = 12;
    const right = width - 12;
    const base = height - 22;
    const x = (d: number) => left + ((d + 0.5) / 365) * (right - left);
    const font = "11px ui-sans-serif, system-ui";
    ctx.save();
    ctx.strokeStyle = colors.gridStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, base);
    ctx.lineTo(right, base);
    ctx.stroke();
    ctx.font = font;
    ctx.fillStyle = colors.muted;
    MONTH_START.forEach((d, i) => {
      const px = left + (d / 365) * (right - left);
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(px, base - 4);
      ctx.lineTo(px, base + 4);
      ctx.stroke();
      if (width > 420 || i % 2 === 0) ctx.fillText(t.months[i], px + 3, base + 16);
    });
    if (!last) {
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.fillText(t.empty, width / 2, base - 26);
      ctx.restore();
      return;
    }
    const r = Math.max(2.6, Math.min(4.2, (right - left) / 365 * 1.6));
    const stack = new Map<number, number>();
    for (const d of last) {
      const k = stack.get(d) ?? 0;
      stack.set(d, k + 1);
      const hit = shared.has(d);
      ctx.fillStyle = hit ? colors.e1 : colors.ink2;
      ctx.globalAlpha = hit ? 1 : 0.75;
      ctx.beginPath();
      ctx.arc(x(d), base - 7 - k * (2 * r + 1.5), hit ? r + 0.8 : r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = shared.size ? colors.e1 : colors.ink2;
    ctx.fillText(t.last(last.length, shared.size), left, 14);
    ctx.restore();
  }, [colors, last, shared, t]);

  useEffect(() => { drawCurve(); }, [drawCurve, resize]);
  useEffect(() => { drawYear(); }, [drawYear, resize]);

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color={colors.ink} label={t.legendExact} />
        <LegendItem color={colors.leo} dash="6 5" label={t.legendBound} formula={`1-e^{-n(n-1)/730}`} />
        <LegendItem color={colors.accent2} dash="2 4" label={t.legendMine} />
        {freq !== null && <LegendItem color={colors.e1} dot label={t.legendFreq} />}
      </ul>
      <canvas ref={curveRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule">
        <canvas ref={yearRef} className="exp-canvas" role="img" aria-label={last ? t.last(last.length, shared.size) : t.empty} />
      </div>
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.n}</span><span className="mono">{n}</span></div>
          <input type="range" min={2} max={N_MAX} step={1} value={n} onChange={(e) => changeN(Number(e.target.value))} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => simulate(1)}>{t.run1}</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => simulate(100)}>{t.run100}</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => changeN(n)} disabled={trials === 0}>{t.reset}</button>
        </div>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: tex(`1-\\frac{365\\cdot364\\cdots(365-n+1)}{365^n}`) }} />
        <span><span className="text-muted">{t.pairs}</span> <span className="mono text-ink">{pairs(n)}</span></span>
        <span><span className="text-muted">{t.exact}</span> <span className="mono text-ink">{exact.toFixed(6)}</span></span>
        <span><span className="text-muted">{t.bound}</span> <span className="mono text-leo">{bound.toFixed(6)}</span></span>
        <span><span className="text-muted">{t.mine}</span> <span className="mono" style={{ color: colors.accent2 }}>{mine.toFixed(6)}</span></span>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span><span className="text-muted">{t.classes}</span> <span className="mono text-ink">{trials}</span></span>
        <span><span className="text-muted">{t.hits}</span> <span className="mono text-ink">{hits}</span></span>
        <span><span className="text-muted">{t.freq}</span> <span className="mono" style={{ color: colors.e1 }}>{freq === null ? "—" : format(freq, 4)}</span></span>
      </div>
    </div>
  );
}

