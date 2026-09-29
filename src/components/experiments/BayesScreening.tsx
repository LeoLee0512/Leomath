"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { fitCanvas } from "@/lib/plot";
import { posterior, screeningCounts } from "@/lib/math/probability";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";

const copy = {
  zh: {
    prior: "患病率（先验）", sens: "灵敏度 P(+ | 病)", fpr: "误报率 P(+ | 健康)",
    retest: "复检阳性者",
    tp: "患病 · 阳性", fn: "患病 · 阴性", fp: "健康 · 阳性", tn: "健康 · 阴性",
    first: (n: number) => `${n} 人参加检测`,
    second: (n: number) => `第一次呈阳性的 ${n} 人再测一次`,
    positives: "阳性", ill: "其中患病", share: "占比（人数取整）",
    chain: "先验 → 后验", exact: "精确后验",
    hint: "一千个人：方块是病人，圆点是健康人；实心是阳性，空心是阴性。阳性的人里，真正患病的占多少？",
  },
  en: {
    prior: "prevalence (prior)", sens: "sensitivity P(+ | ill)", fpr: "false-positive rate P(+ | healthy)",
    retest: "Retest the positives",
    tp: "ill · positive", fn: "ill · negative", fp: "healthy · positive", tn: "healthy · negative",
    first: (n: number) => `${n} people tested`,
    second: (n: number) => `The ${n} first-time positives, tested again`,
    positives: "positives", ill: "of them ill", share: "share (whole people)",
    chain: "prior → posterior", exact: "exact posterior",
    hint: "A thousand people: squares are ill, circles healthy; filled is positive, hollow negative. What share of the positives are really ill?",
  },
};

const N = 1000;
type Person = { ill: boolean; pos: boolean };

function population(tp: number, fn: number, fp: number, tn: number): Person[] {
  const out: Person[] = [];
  const push = (k: number, ill: boolean, pos: boolean) => { for (let i = 0; i < k && out.length < N; i++) out.push({ ill, pos }); };
  push(tp, true, true);
  push(fp, false, true);
  push(fn, true, false);
  push(tn, false, false);
  return out;
}

export function BayesScreening({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const bayesHtml = useTex("bayes");
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [prior, setPrior] = useUrlState("prior", 0.01, { min: 0.001, max: 0.3 });
  const [sens, setSens] = useUrlState("sens", 0.95, { min: 0.5, max: 1 });
  const [fpr, setFpr] = useUrlState("fpr", 0.08, { min: 0, max: 0.3 });
  const [retest, setRetest] = useUrlState("retest", false);

  const c1 = screeningCounts(N, prior, sens, fpr);
  const post1 = posterior(prior, sens, fpr);
  const post2 = posterior(post1, sens, fpr);
  // Second round: only the first-time positives, each tested again.
  // Round the expected counts once, from the population, not from already-rounded first-round counts.
  const tp2 = Math.min(c1.tp, Math.round(N * prior * sens * sens));
  const fp2 = Math.min(c1.fp, Math.round(N * (1 - prior) * fpr * fpr));
  const c = retest ? { tp: tp2, fn: c1.tp - tp2, fp: fp2, tn: c1.fp - fp2 } : c1;
  const people = useMemo(() => population(c.tp, c.fn, c.fp, c.tn), [c.tp, c.fn, c.fp, c.tn]);
  const pos = c.tp + c.fp;
  const share = pos > 0 ? c.tp / pos : 0;

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { width, height, ctx } = fitCanvas(el, 2.1);
    ctx.clearRect(0, 0, width, height);
    const top = 30;
    const pad = 14;
    const n = people.length;
    const font = "12px ui-sans-serif, system-ui";
    ctx.font = font;
    ctx.fillStyle = colors.muted;
    ctx.fillText(retest ? t.second(n) : t.first(n), pad, 19);
    if (n === 0) return;
    // Fill column by column so each group forms a contiguous block, read left to right.
    const w = width - 2 * pad;
    const h = height - top - pad;
    const rows = Math.max(1, Math.round(Math.sqrt((n * h) / w)));
    const cols = Math.ceil(n / rows);
    const cell = Math.min(w / cols, h / rows);
    const r = Math.max(1.6, cell * 0.36);
    const x0 = pad + (w - cols * cell) / 2;
    people.forEach((p, i) => {
      const cx = x0 + Math.floor(i / rows) * cell + cell / 2;
      const cy = top + (i % rows) * cell + cell / 2;
      const col = p.ill ? colors.e1 : colors.ink2;
      // Shape carries illness (square = ill, circle = healthy), fill carries the test result; colour only reinforces.
      ctx.beginPath();
      const s = p.pos ? r : r * 0.8;
      if (p.ill) ctx.rect(cx - s * 0.9, cy - s * 0.9, s * 1.8, s * 1.8);
      else ctx.arc(cx, cy, s, 0, Math.PI * 2);
      if (p.pos) {
        ctx.fillStyle = col;
        ctx.globalAlpha = 1;
        ctx.fill();
      } else {
        ctx.strokeStyle = col;
        ctx.globalAlpha = p.ill ? 0.9 : 0.28;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }, [colors, people, retest, t]);

  useEffect(() => { draw(); }, [draw, resize]);

  const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--e1)" square label={t.tp} />
        <LegendItem color="var(--ink-2)" dot label={t.fp} />
        <LegendItem color="var(--e1)" squareRing label={t.fn} />
        <LegendItem color="var(--muted)" ring label={t.tn} />
      </ul>
      <canvas ref={canvasRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-3">
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.prior}</span><span className="mono">{pct(prior)}</span></div>
          <input type="range" aria-valuetext={pct(prior)} className="e1" min={0.001} max={0.3} step={0.001} value={prior} onChange={(e) => setPrior(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.sens}</span><span className="mono">{pct(sens)}</span></div>
          <input type="range" aria-valuetext={pct(sens)} min={0.5} max={1} step={0.01} value={sens} onChange={(e) => setSens(Number(e.target.value))} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.fpr}</span><span className="mono">{pct(fpr)}</span></div>
          <input type="range" aria-valuetext={pct(fpr)} min={0} max={0.3} step={0.005} value={fpr} onChange={(e) => setFpr(Number(e.target.value))} />
        </label>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <button type="button" className={`btn btn-ghost btn-small ${retest ? "border-ink" : ""}`} aria-pressed={retest} onClick={() => setRetest((v) => !v)}>{t.retest}</button>
        <span><span className="text-muted">{t.positives}</span> <span className="mono text-ink">{pos}</span></span>
        <span><span className="text-muted">{t.ill}</span> <span className="mono text-e1">{c.tp}</span></span>
        <span><span className="text-muted">{t.share}</span> <span className="mono text-e1">{pos > 0 ? `${c.tp}/${pos} ≈ ${share.toFixed(3)}` : "—"}</span></span>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: bayesHtml }} />
        <span>
          <span className="text-muted">{t.chain}</span>{" "}
          <span className="mono text-ink">{prior.toFixed(3)}</span>
          <span className="text-muted"> → </span>
          <span className={`mono ${retest ? "text-muted" : "text-e1"}`}>{post1.toFixed(3)}</span>
          {retest && (
            <>
              <span className="text-muted"> → </span>
              <span className="mono text-e1">{post2.toFixed(3)}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
