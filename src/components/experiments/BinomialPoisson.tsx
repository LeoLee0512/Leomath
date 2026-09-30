"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { binomialMode, binomialPmf, binomialPoissonDistance, poissonPmf, sampleTrials } from "@/lib/math/probability";
import { format } from "@/lib/math/linear";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";

const copy = {
  zh: {
    lambda: "平均次数 λ = np", n: "试验次数 n", p: "单次概率 p = λ/n",
    legendB: "二项分布 B(n, p)", legendP: "Poisson(λ)", legendF: "抽样频率",
    presets: "试试", tie: "峰值并列",
    run1: "抽样 1 次", run100: "抽样 100 次", clear: "清空抽样",
    mode: "最可能的值", modeAt: (m: string) => `(n+1)p = ${m}`,
    dist: "两者的距离 d", bound: "上界 λ²/n",
    samples: "已抽样", mean: "样本均值", vs: "理论均值 λ",
    trialsEmpty: (n: number) => `点“抽样”，做一次 ${n} 重试验`,
    trialsLast: (n: number, k: number) => `上一次：${n} 次试验中成功 ${k} 次，X(ω) = ${k}`,
    distTitle: "距离 d 随 n 的变化（双对数坐标）",
    hint: "柱子是 n 次独立试验中成功次数的分布，圆点是同一平均次数 λ 的 Poisson 分布。增大 n、保持 λ 不变，看两者怎样重合。",
    distHint: (d: string) => `当前 n 下两者的距离约为 ${d}；n 每增大十倍，距离约缩小为十分之一。`,
  },
  en: {
    lambda: "average count λ = np", n: "number of trials n", p: "success probability p = λ/n",
    legendB: "binomial B(n, p)", legendP: "Poisson(λ)", legendF: "sampled frequency",
    presets: "Try", tie: "tied peak",
    run1: "Sample once", run100: "Sample 100 times", clear: "Clear samples",
    mode: "most likely value", modeAt: (m: string) => `(n+1)p = ${m}`,
    dist: "distance d between them", bound: "bound λ²/n",
    samples: "samples", mean: "sample mean", vs: "theoretical mean λ",
    trialsEmpty: (n: number) => `Press “Sample” to run ${n} trials once`,
    trialsLast: (n: number, k: number) => `Last run: ${k} successes in ${n} trials, X(ω) = ${k}`,
    distTitle: "distance d against n (log–log scale)",
    hint: "The bars are the distribution of the number of successes in n independent trials; the dots are the Poisson law with the same average λ. Raise n while keeping λ fixed and watch them merge.",
    distHint: (d: string) => `At the current n the distance is about ${d}; each tenfold increase of n divides it by about ten.`,
  },
};

const N_MAX = 1000;
const LAMBDA_MIN = 0.5;
const LAMBDA_MAX = 10;
const PRESETS = [
  { n: 10 },
  { n: 100 },
  { n: 1000 },
  { n: 9, lambda: 4.5, tie: true },
] as const;

/** Largest k worth drawing: beyond it both laws are negligible. */
const kMaxFor = (lambda: number) => Math.max(6, Math.ceil(lambda + 4 * Math.sqrt(lambda) + 2));

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const superscript = (e: number) => [...String(e)].map((ch) => SUP[ch] ?? ch).join("");

/** A readable number for small distances: 0.086, 0.00075, 2.8e-5. */
const small = (x: number) => (x >= 1e-4 ? x.toPrecision(2) : x.toExponential(1));

export function BinomialPoisson({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const binomHtml = useTex("binomial");
  const poissonHtml = useTex("poisson");
  const distHtml = useTex("distance");
  const wrapRef = useRef<HTMLDivElement>(null);
  const pmfRef = useRef<HTMLCanvasElement>(null);
  const trialsRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [lambda, setLambdaRaw] = useUrlState("lambda", 3, { min: LAMBDA_MIN, max: LAMBDA_MAX });
  const [nRaw, setNRaw] = useUrlState("n", 10, { min: 1, max: N_MAX, integer: true });
  // p = λ/n must not exceed 1.
  const nMin = Math.ceil(lambda - 1e-9);
  const n = Math.max(nRaw, nMin);
  const p = lambda / n;

  const [counts, setCounts] = useState<number[]>([]);
  const [last, setLast] = useState<boolean[] | null>(null);
  const total = counts.reduce((a, b) => a + b, 0);
  const mean = total > 0 ? counts.reduce((a, c, k) => a + c * k, 0) / total : null;

  const clearSamples = () => {
    setCounts([]);
    setLast(null);
  };
  const setLambda = (v: number) => {
    setLambdaRaw(v);
    clearSamples();
  };
  const setN = (v: number) => {
    setNRaw(Math.min(N_MAX, Math.max(1, Math.round(v))));
    clearSamples();
  };

  const kMax = kMaxFor(lambda);
  const binom = useMemo(() => binomialPmf(n, p), [n, p]);
  const poisson = useMemo(() => poissonPmf(lambda, kMax), [lambda, kMax]);
  const mode = useMemo(() => binomialMode(n, p), [n, p]);
  const distance = useMemo(() => binomialPoissonDistance(n, lambda), [n, lambda]);
  // The distance curve over n, sampled on a logarithmic grid.
  const curve = useMemo(() => {
    const ns = new Set<number>();
    const lo = Math.log10(Math.max(1, nMin));
    for (let i = 0; i <= 90; i++) ns.add(Math.round(10 ** (lo + ((3 - lo) * i) / 90)));
    return [...ns].filter((m) => m >= nMin).map((m) => [m, binomialPoissonDistance(m, lambda)] as const);
  }, [lambda, nMin]);

  const sample = (times: number) => {
    const next = counts.length === n + 1 ? [...counts] : new Array<number>(n + 1).fill(0);
    let trials: boolean[] = [];
    for (let i = 0; i < times; i++) {
      trials = sampleTrials(n, p);
      next[trials.filter(Boolean).length]++;
    }
    setCounts(next);
    setLast(trials);
  };

  const drawPmf = useCallback(() => {
    const c = pmfRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, 2);
    ctx.clearRect(0, 0, width, height);
    const font = "11px ui-sans-serif, system-ui";
    const freq = total > 0 ? counts.map((x) => x / total) : [];
    let top = Math.max(...binom.slice(0, kMax + 1), ...poisson);
    for (let k = 0; k <= kMax && k < freq.length; k++) top = Math.max(top, freq[k]);
    top *= 1.12;
    // Leave room on the left for the probability labels and below for k.
    const xPad = (kMax + 1.6) * (34 / width);
    const plot = new Plot(ctx, width, height, [-0.8 - xPad, kMax + 0.8], [-top * 0.1, top]);
    const step = top > 0.5 ? 0.2 : top > 0.25 ? 0.1 : top > 0.1 ? 0.05 : 0.02;
    ctx.save();
    ctx.lineWidth = 1;
    for (let y = 0; y <= top + 1e-9; y += step) {
      ctx.strokeStyle = y === 0 ? colors.gridStrong : colors.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x(-0.6), plot.y(y));
      ctx.lineTo(plot.x(kMax + 0.6), plot.y(y));
      ctx.stroke();
      plot.label(format(y, 2), -0.6, y, colors.muted, -32, 4, font);
    }
    ctx.restore();
    const every = Math.max(1, Math.ceil((kMax + 1) / (width / 26)));
    for (let k = 0; k <= kMax; k += every) plot.label(String(k), k, 0, colors.muted, k >= 10 ? -7 : -3, 15, font);

    const bw = 0.62;
    const bar = (k: number, h: number) => [plot.x(k - bw / 2), plot.y(h), plot.x(k + bw / 2) - plot.x(k - bw / 2), plot.y(0) - plot.y(h)] as const;
    // Binomial bars; the most likely value is drawn darker.
    for (let k = 0; k <= Math.min(n, kMax); k++) {
      ctx.fillStyle = colors.ink2;
      ctx.globalAlpha = mode.includes(k) ? 0.62 : 0.26;
      ctx.fillRect(...bar(k, binom[k]));
    }
    ctx.globalAlpha = 1;
    // Sampled frequencies as hollow bars on top.
    ctx.strokeStyle = colors.e1;
    ctx.lineWidth = 1.6;
    for (let k = 0; k <= kMax && k < freq.length; k++) if (freq[k] > 0) ctx.strokeRect(...bar(k, freq[k]));
    // Poisson: dots joined by a thin line, so its shape reads at a glance.
    plot.polyline(poisson.map((v, k) => [k, v] as const), colors.leo, 1, [3, 3]);
    poisson.forEach((v, k) => plot.dot(k, v, colors.leo, 3.6));
    // Where (n+1)p falls: the peak is the whole number just below it.
    const m = (n + 1) * p;
    if (m <= kMax + 0.5) {
      const x = plot.x(m);
      const y = plot.y(0) + 2;
      ctx.fillStyle = colors.accent2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 8);
      ctx.lineTo(x + 5, y + 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [binom, colors, counts, kMax, mode, n, p, poisson, total]);

  const drawTrials = useCallback(() => {
    const c = trialsRef.current;
    if (!c) return;
    const w0 = c.clientWidth || 600;
    const pad = 12;
    // At most 100 per row, and cells no smaller than 6 px on narrow screens.
    const cols = Math.min(n, 100, Math.max(20, Math.floor((w0 - 2 * pad) / 6)));
    const rows = Math.ceil(n / cols);
    const cell = Math.min(14, (w0 - 2 * pad) / cols);
    // Same height before and after sampling, so the buttons below do not move.
    const h0 = 30 + rows * cell + 10;
    const { width, ctx } = fitCanvas(c, w0 / h0);
    ctx.clearRect(0, 0, width, h0);
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillStyle = last ? colors.ink2 : colors.muted;
    ctx.fillText(last ? t.trialsLast(n, last.filter(Boolean).length) : t.trialsEmpty(n), pad, 19);
    const gap = cell > 6 ? 1.5 : cell > 3 ? 0.6 : 0;
    for (let i = 0; i < n; i++) {
      const x = pad + (i % cols) * cell;
      const y = 30 + Math.floor(i / cols) * cell;
      ctx.fillStyle = last?.[i] ? colors.e1 : colors.grid;
      ctx.fillRect(x, y, cell - gap, cell - gap);
    }
  }, [colors, last, n, t]);

  const drawDistance = useCallback(() => {
    const c = distRef.current;
    if (!c) return;
    const { width, height, ctx } = fitCanvas(c, (c.clientWidth || 600) < 520 ? 2.2 : 3.2);
    ctx.clearRect(0, 0, width, height);
    const font = "11px ui-sans-serif, system-ui";
    const logs = curve.map(([, d]) => Math.log10(Math.max(d, 1e-12)));
    const yLo = Math.floor(Math.min(...logs, Math.log10(distance)) - 0.2);
    const yHi = Math.max(0, Math.ceil(Math.max(...logs)));
    const xLo = Math.log10(Math.max(1, nMin));
    const left = 44;
    const plot = new Plot(ctx, width, height, [xLo - (3 - xLo + 0.2) * (left / (width - left)), 3.08], [yLo - (yHi - yLo) * 0.2, yHi + (yHi - yLo) * 0.3]);
    ctx.save();
    ctx.lineWidth = 1;
    for (let e = 0; e <= 3; e++) {
      if (e < xLo - 1e-9) continue;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x(e), plot.y(yLo));
      ctx.lineTo(plot.x(e), plot.y(yHi));
      ctx.stroke();
      plot.label(`n=${10 ** e}`, e, yLo, colors.muted, e === 3 ? -34 : -8, 14, font);
    }
    for (let e = yLo; e <= yHi; e++) {
      ctx.strokeStyle = e === yHi ? colors.gridStrong : colors.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x(xLo), plot.y(e));
      ctx.lineTo(plot.x(3), plot.y(e));
      ctx.stroke();
      plot.label(e === 0 ? "1" : `10${superscript(e)}`, xLo, e, colors.muted, -40, 4, font);
    }
    ctx.restore();
    // Le Cam: d ≤ λ²/n, a straight line of slope −1 here.
    plot.polyline(curve.map(([m]) => [Math.log10(m), Math.log10(Math.min((lambda * lambda) / m, 10 ** yHi))] as const), colors.accent2, 1.4, [6, 5]);
    plot.polyline(curve.map(([m], i) => [Math.log10(m), logs[i]] as const), colors.ink, 2);
    plot.dot(Math.log10(n), Math.log10(distance), colors.e1, 4.5);
    // Name the two lines at their right ends.
    plot.label("d", 3, logs[logs.length - 1], colors.ink, -10, -8, font);
    plot.label("λ²/n", 3, Math.log10((lambda * lambda) / 1000), colors.accent2, -30, -6, font);
    ctx.font = font;
    ctx.fillStyle = colors.muted;
    ctx.fillText(t.distTitle, left + 6, 14);
  }, [colors, curve, distance, lambda, n, nMin, t]);

  useEffect(() => { drawPmf(); }, [drawPmf, resize]);
  useEffect(() => { drawTrials(); }, [drawTrials, resize]);
  useEffect(() => { drawDistance(); }, [drawDistance, resize]);

  // The n slider moves on a log scale; the keyboard steps through whole numbers (1% at a time once n is large).
  const onNKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const stepUp = Math.max(1, Math.round(n * 0.05));
    const stepDown = Math.max(1, Math.round((n / 1.05) * 0.05));
    const next =
      e.key === "ArrowUp" || e.key === "ArrowRight" ? n + stepUp
      : e.key === "ArrowDown" || e.key === "ArrowLeft" ? n - stepDown
      : e.key === "PageUp" ? n * 2
      : e.key === "PageDown" ? n / 2
      : e.key === "Home" ? nMin
      : e.key === "End" ? N_MAX
      : null;
    if (next === null) return;
    e.preventDefault();
    setN(Math.max(nMin, next));
  };

  const modeText = mode.join(locale === "zh" ? " 和 " : " and ");

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--ink-2)" square label={t.legendB} formulaHtml={binomHtml} />
        <LegendItem color="var(--leo)" dot label={t.legendP} formulaHtml={poissonHtml} />
        {total > 0 && <LegendItem color="var(--e1)" squareRing label={t.legendF} />}
      </ul>
      <canvas ref={pmfRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule">
        <canvas ref={trialsRef} className="exp-canvas" role="img" aria-label={last ? t.trialsLast(n, last.filter(Boolean).length) : t.trialsEmpty(n)} />
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => sample(1)}>{t.run1}</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => sample(100)}>{t.run100}</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={clearSamples} disabled={total === 0}>{t.clear}</button>
        </div>
        <span aria-live="polite" className="flex flex-wrap gap-x-6 gap-y-2">
          <span><span className="text-muted">{t.samples}</span> <span className="mono text-ink">{total}</span></span>
          <span><span className="text-muted">{t.mean}</span> <span className="mono text-e1">{mean === null ? "—" : format(mean, 3)}</span></span>
          <span><span className="text-muted">{t.vs}</span> <span className="mono text-ink">{lambda.toFixed(1)}</span></span>
        </span>
      </div>
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.lambda}</span><span className="mono">{lambda.toFixed(1)}</span></div>
          <input type="range" className="e1" min={LAMBDA_MIN} max={LAMBDA_MAX} step={0.1} value={lambda} aria-valuetext={`λ = ${lambda.toFixed(1)}`} onChange={(e) => setLambda(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.n}</span><span className="mono">{n}</span></div>
          <input type="range" min={Math.log10(Math.max(1, nMin))} max={3} step={0.005} value={Math.log10(n)} aria-valuetext={`n = ${n}`} onKeyDown={onNKey} onChange={(e) => setN(Math.max(nMin, Math.round(10 ** Number(e.target.value))))} />
        </label>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-2 exp-control">
        <span className="text-muted mr-1">{t.presets}</span>
        {PRESETS.map((q) => {
          const on = n === q.n && ("lambda" in q ? lambda === q.lambda : true);
          return (
            <button
              key={q.n}
              type="button"
              className={`btn btn-ghost btn-small ${on ? "border-ink" : ""}`}
              aria-pressed={on}
              onClick={() => {
                if ("lambda" in q) setLambdaRaw(q.lambda);
                setN(q.n);
              }}
            >
              {"tie" in q ? `${t.tie}: n = ${q.n}, λ = ${q.lambda}` : `n = ${q.n}`}
            </button>
          );
        })}
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span><span className="text-muted">{t.p}</span> <span className="mono text-ink">{format(p, 4)}</span></span>
        <span><span className="text-muted">{t.mode}</span> <span className="mono text-ink">{modeText}</span> <span className="text-accent-2 mono"><span aria-hidden="true">▲ </span>{t.modeAt(format((n + 1) * p, 3))}</span></span>
      </div>
      <div className="border-t border-rule">
        <canvas ref={distRef} className="exp-canvas" role="img" aria-label={t.distHint(small(distance))} />
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: distHtml }} />
        <span><span className="text-muted">{t.dist}</span> <span className="mono text-e1">{small(distance)}</span></span>
        <span><span className="text-muted">{t.bound}</span> <span className="mono text-accent-2">{small((lambda * lambda) / n)}</span></span>
      </div>
    </div>
  );
}
