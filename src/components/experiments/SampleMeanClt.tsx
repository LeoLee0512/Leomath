"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { distributions, histogram, moments, normalPdf, sampleMeans, standardize } from "@/lib/math/clt";
import { format } from "@/lib/math/linear";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";

const N_CHOICES = [1, 2, 5, 10, 30, 100];
const SAMPLE_COUNT = 5000;
const BINS = 48;

const copy = {
  zh: {
    source: "母分布：每次独立抽一个 Xᵢ",
    histogram: "5000 个样本均值的分布，虚线是理论正态曲线",
    bernoulli: "Bernoulli(p)：偏斜的 0–1 分布",
    uniform: "U(0, 1)：均匀分布",
    exponential: "Exp(1)：右偏的指数分布",
    n: "每个样本的容量 n",
    raw: "样本均值",
    standardized: "标准化后",
    rerun: "重新抽 5000 次",
    empiricalMean: "均值的均值",
    empiricalSd: "均值的标准差",
    theoretical: "理论值",
    normal: "正态近似",
    sampleHist: "模拟直方图",
    sourceMean: "母分布均值 μ",
    meanSpread: "均值的标准差 σ/√n",
    hint: "换母分布或增大 n，看样本均值的形状和宽度怎样变化。标准化后，不同母分布都趋向同一条钟形曲线。",
  },
  en: {
    source: "Source: draw each Xᵢ independently",
    histogram: "Distribution of 5000 sample means; the dashed curve is the normal approximation",
    bernoulli: "Bernoulli(p): a skewed 0–1 law",
    uniform: "U(0, 1): the uniform law",
    exponential: "Exp(1): the right-skewed exponential law",
    n: "Sample size n",
    raw: "Sample means",
    standardized: "Standardised",
    rerun: "Draw 5000 new samples",
    empiricalMean: "Mean of the means",
    empiricalSd: "SD of the means",
    theoretical: "Theoretical",
    normal: "Normal approximation",
    sampleHist: "Simulated histogram",
    sourceMean: "Source mean μ",
    meanSpread: "SD of the mean σ/√n",
    hint: "Change the source law or increase n to see the shape and spread of the sample mean. After standardisation, every source tends to the same bell curve.",
  },
};

export function SampleMeanClt({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const meanHtml = useTex("sampleMean");
  const standardizedHtml = useTex("standardizedMean");
  const varianceHtml = useTex("varianceMean");
  const wrapRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [id, setId] = useUrlState("dist", "bernoulli", ["bernoulli", "uniform", "exponential"] as const);
  const [n, setN] = useUrlState("n", 10, { min: 1, max: 100, integer: true });
  const [standardized, setStandardized] = useUrlState("standard", false);
  const [p, setP] = useUrlState("p", 0.1, { min: 0.05, max: 0.5 });
  const [seed, setSeed] = useState(1);

  const definition = distributions[id];
  const mu = id === "bernoulli" ? p : definition.mean;
  const sigma = id === "bernoulli" ? Math.sqrt(p * (1 - p)) : definition.sd;
  const meanSd = sigma / Math.sqrt(n);
  const means = useMemo(() => sampleMeans(id, n, SAMPLE_COUNT, seed, p), [id, n, seed, p]);
  const values = useMemo(() => standardized ? standardize(means, mu, meanSd) : means, [means, standardized, mu, meanSd]);
  const empirical = useMemo(() => moments(values), [values]);
  const centre = standardized ? 0 : mu;
  const spread = standardized ? 1 : meanSd;
  const [lo, hi] = standardized ? [-4, 4] : id === "bernoulli" && n === 1 ? [0, 1] : id === "uniform" && n === 1 ? [0, 1] : id === "exponential" && n === 1 ? [0, 5] : [mu - 4 * meanSd, mu + 4 * meanSd];
  const bars = useMemo(() => histogram(values, lo, hi, BINS), [values, lo, hi]);

  const drawSource = useCallback(() => {
    const el = sourceRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, 2.1);
    ctx.clearRect(0, 0, width, height);
    const plot = new Plot(ctx, width, height, id === "exponential" ? [0, 5] : [-0.1, 1.1], [0, 1.12]);
    plot.grid(colors.grid, 0.2, colors.gridStrong);
    if (id === "bernoulli") {
      ctx.fillStyle = colors.ink2;
      ctx.globalAlpha = 0.5;
      for (const [x, prob] of [[0, 1 - p], [1, p]] as const) {
        const left = plot.x(x - 0.06);
        ctx.fillRect(left, plot.y(prob), plot.x(x + 0.06) - left, plot.y(0) - plot.y(prob));
      }
      ctx.globalAlpha = 1;
      plot.label("0", 0, 0, colors.muted, -3, 16);
      plot.label("1", 1, 0, colors.muted, -3, 16);
    } else if (id === "uniform") {
      ctx.fillStyle = colors.ink2;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(plot.x(0), plot.y(1), plot.x(1) - plot.x(0), plot.y(0) - plot.y(1));
      ctx.globalAlpha = 1;
      plot.polyline([[0, 1], [1, 1]], colors.ink2, 2);
      plot.label("0", 0, 0, colors.muted, -3, 16);
      plot.label("1", 1, 0, colors.muted, -3, 16);
    } else {
      plot.fn((x) => Math.exp(-x), colors.ink2, 2);
      plot.label("0", 0, 0, colors.muted, -3, 16);
      plot.label("5", 5, 0, colors.muted, -15, 16);
    }
    plot.polyline([[mu, 0], [mu, 1.08]], colors.e1, 1.5, [5, 4]);
    plot.label("μ", mu, 1.03, colors.e1, 5, 0);
  }, [colors, id, mu, p]);

  const drawHistogram = useCallback(() => {
    const el = histRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, 2.1);
    ctx.clearRect(0, 0, width, height);
    const normalMax = normalPdf(centre, centre, spread);
    const top = Math.max(normalMax, ...bars) * 1.15;
    const plot = new Plot(ctx, width, height, [lo, hi], [0, top]);
    plot.grid(colors.grid, top / 4, colors.gridStrong);
    const widthX = (hi - lo) / BINS;
    ctx.fillStyle = colors.ink2;
    ctx.globalAlpha = 0.42;
    bars.forEach((density, i) => {
      const x0 = lo + i * widthX;
      const left = plot.x(x0);
      ctx.fillRect(left, plot.y(density), Math.max(1, plot.x(x0 + widthX) - left - 1), plot.y(0) - plot.y(density));
    });
    ctx.globalAlpha = 1;
    plot.fn((x) => normalPdf(x, centre, spread), colors.e1, 2, [7, 5]);
    plot.polyline([[centre, 0], [centre, top * 0.95]], colors.accent2, 1.2, [4, 4]);
    for (const x of [lo, centre, hi]) plot.label(format(x, 1), x, 0, colors.muted, -5, 16);
  }, [bars, centre, colors, hi, lo, spread]);

  useEffect(() => { drawSource(); drawHistogram(); }, [drawSource, drawHistogram, resize]);

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--ink-2)" square label={t.sampleHist} />
        <LegendItem color="var(--e1)" label={t.normal} />
      </ul>
      <div className="grid md:grid-cols-2">
        <div>
          <p className="px-4 pt-2 text-xs text-muted">{t.source}</p>
          <canvas ref={sourceRef} className="exp-canvas" role="img" aria-label={t[id]} />
        </div>
        <div className="border-t md:border-t-0 md:border-l border-rule">
          <p className="px-4 pt-2 text-xs text-muted">{t.histogram}</p>
          <canvas ref={histRef} className="exp-canvas" role="img" aria-label={t.hint} />
        </div>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-2 exp-control">
        {(["bernoulli", "uniform", "exponential"] as const).map((value) => (
          <button key={value} type="button" className={`btn btn-ghost btn-small ${id === value ? "border-ink" : ""}`} aria-pressed={id === value} onClick={() => setId(value)}>
            {t[value]}
          </button>
        ))}
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3 exp-control">
        <span className="text-muted">{t.n}</span>
        <span role="group" aria-label={t.n} className="flex flex-wrap gap-2">
          {N_CHOICES.map((value) => (
            <button key={value} type="button" className={`btn btn-ghost btn-small ${n === value ? "border-ink" : ""}`} aria-pressed={n === value} onClick={() => setN(value)}>
              {value}
            </button>
          ))}
        </span>
        <span className="flex gap-2 ml-auto">
          <button type="button" className={`btn btn-ghost btn-small ${!standardized ? "border-ink" : ""}`} aria-pressed={!standardized} onClick={() => setStandardized(false)}>{t.raw}</button>
          <button type="button" className={`btn btn-ghost btn-small ${standardized ? "border-ink" : ""}`} aria-pressed={standardized} onClick={() => setStandardized(true)}>{t.standardized}</button>
        </span>
      </div>
      {id === "bernoulli" && (
        <label className="border-t border-rule px-4 py-3 exp-control block">
          <div className="flex justify-between"><span>Bernoulli p</span><span className="mono">{p.toFixed(2)}</span></div>
          <input type="range" min={0.05} max={0.5} step={0.01} value={p} aria-valuetext={`p = ${p.toFixed(2)}`} onChange={(event) => setP(Number(event.target.value))} />
        </label>
      )}
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setSeed((s) => s + 1)}>{t.rerun}</button>
        <span aria-live="polite" className="flex flex-wrap gap-x-6 gap-y-2">
          <span><span className="text-muted">{t.empiricalMean}</span> <span className="mono text-ink">{format(empirical.mean, 3)}</span></span>
          <span><span className="text-muted">{t.empiricalSd}</span> <span className="mono text-ink">{format(empirical.sd, 3)}</span></span>
          <span><span className="text-muted">{t.theoretical}</span> <span className="mono text-ink-2">{format(centre, 2)} ± {format(spread, 3)}</span></span>
        </span>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span><span className="text-muted">{t.sourceMean}</span> <span className="mono text-ink">{format(mu, 3)}</span></span>
        <span><span className="text-muted">{t.meanSpread}</span> <span className="mono text-ink">{format(meanSd, 3)}</span></span>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: meanHtml }} />
        <span dangerouslySetInnerHTML={{ __html: standardizedHtml }} />
        <span dangerouslySetInnerHTML={{ __html: varianceHtml }} />
      </div>
    </div>
  );
}
