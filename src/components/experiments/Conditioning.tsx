"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { fitCanvas } from "@/lib/plot";
import { conditionals } from "@/lib/math/probability";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";

const copy = {
  zh: {
    pA: "P(A)", pB: "P(B)", pAB: "P(A∩B)",
    independent: "独立", exclusive: "互斥", inside: "B ⊂ A", condition: "以 B 为条件",
    legendA: "事件 A（左边一列）", legendAB: "A ∩ B", legendBonly: "B 在 A 之外的部分", legendPB: "P(B) 的高度",
    renorm: "B 当作全空间", union: "P(A∪B)", delta: "P(A∩B) − P(A)P(B)",
    indep: "独立", pos: "正相关", neg: "负相关",
    hint: "样本空间是面积为 1 的正方形，A 占左边一列，B 在 A 内外各占一定高度。",
  },
  en: {
    pA: "P(A)", pB: "P(B)", pAB: "P(A∩B)",
    independent: "Independent", exclusive: "Mutually exclusive", inside: "B ⊂ A", condition: "Condition on B",
    legendA: "event A (left column)", legendAB: "A ∩ B", legendBonly: "B outside A", legendPB: "height P(B)",
    renorm: "B as the whole space", union: "P(A∪B)", delta: "P(A∩B) − P(A)P(B)",
    indep: "independent", pos: "positively related", neg: "negatively related",
    hint: "The sample space is a unit square; A is the left column; B takes some height inside and outside A.",
  },
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function Conditioning({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [pA, setPA] = useUrlState("pA", 0.5, { min: 0.05, max: 0.95 });
  const [pB, setPB] = useUrlState("pB", 0.4, { min: 0.05, max: 0.95 });
  const [pABraw, setPAB] = useUrlState("pAB", 0.3, { min: 0, max: 0.95 });
  const [given, setGiven] = useUrlState("given", false);
  // Fréchet bounds for P(A∩B), inline so the compiler sees plain numbers.
  const lo = Math.max(0, pA + pB - 1);
  const hi = Math.min(pA, pB);
  const pAB = clamp(pABraw, lo, hi);
  const k = conditionals(pA, pB, pAB);
  const verdict = Math.abs(k.dependence) < 5e-4 ? t.indep : k.dependence > 0 ? t.pos : t.neg;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const q = conditionals(pA, pB, pAB);
    const { width, height, ctx } = fitCanvas(el, 1.9);
    ctx.clearRect(0, 0, width, height);
    const font = "12px ui-sans-serif, system-ui";
    const small = "11px ui-sans-serif, system-ui";
    const narrow = width < 520;
    const left = 30;
    const top = 14;
    const H = height - top - 34;
    const barW = narrow ? 34 : 46;
    const gap = narrow ? 44 : 70;
    const labelRoom = narrow ? 40 : 96;
    const W = Math.min(width - left - gap - barW - labelRoom, H * 1.6);
    const xA = left + pA * W;
    const y = (h: number) => top + H * (1 - h);

    ctx.save();
    // Ω and the A column
    ctx.fillStyle = colors.paper;
    ctx.fillRect(left, top, W, H);
    ctx.fillStyle = colors.leo;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(left, top, xA - left, H);
    ctx.globalAlpha = 1;
    // B inside A (= A∩B) and B outside A
    ctx.fillStyle = colors.e1;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(left, y(q.bGivenA), xA - left, H * q.bGivenA);
    ctx.globalAlpha = 0.22;
    ctx.fillRect(xA, y(q.bGivenNotA), left + W - xA, H * q.bGivenNotA);
    ctx.globalAlpha = 1;
    if (given) {
      // Fade everything outside B, outline B.
      ctx.fillStyle = colors.paper;
      ctx.globalAlpha = 0.78;
      ctx.fillRect(left, top, xA - left, H * (1 - q.bGivenA));
      ctx.fillRect(xA, top, left + W - xA, H * (1 - q.bGivenNotA));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.e1;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(left, y(0));
      ctx.lineTo(left, y(q.bGivenA));
      ctx.lineTo(xA, y(q.bGivenA));
      ctx.lineTo(xA, y(q.bGivenNotA));
      ctx.lineTo(left + W, y(q.bGivenNotA));
      ctx.lineTo(left + W, y(0));
      ctx.closePath();
      ctx.stroke();
    }
    // frame and divider
    ctx.strokeStyle = colors.gridStrong;
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, W, H);
    ctx.beginPath();
    ctx.moveTo(xA, top);
    ctx.lineTo(xA, top + H);
    ctx.stroke();
    // height of P(B): B is a flat band exactly when A and B are independent
    ctx.strokeStyle = colors.accent2;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(left, y(pB));
    ctx.lineTo(left + W, y(pB));
    ctx.stroke();
    ctx.setLineDash([]);

    // labels
    // Column names sit under the square, so the heights above stay readable.
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.fillStyle = colors.ink;
    ctx.fillText(xA - left > 90 ? `A · P(A) = ${pA.toFixed(2)}` : "A", (left + xA) / 2, top + H + 18);
    if (left + W - xA > 24) ctx.fillText("Aᶜ", (xA + left + W) / 2, top + H + 18);
    ctx.font = small;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = "right";
    ctx.fillText("0", left - 6, top + H + 4);
    ctx.fillText("1", left - 6, top + 8);
    const heightLabel = (text: string, x0: number, x1: number, h: number) => {
      if (x1 - x0 < 70) return;
      ctx.textAlign = "center";
      ctx.fillStyle = colors.ink2;
      const yy = h > 0.88 ? y(h) + 15 : y(h) - 6;
      ctx.fillText(text, (x0 + x1) / 2, yy);
    };
    heightLabel(`P(B|A) = ${q.bGivenA.toFixed(2)}`, left, xA, q.bGivenA);
    heightLabel(`P(B|Aᶜ) = ${q.bGivenNotA.toFixed(2)}`, xA, left + W, q.bGivenNotA);

    // B renormalised: a bar of height 1 split into A∩B and B \ A
    const bx = left + W + gap;
    ctx.globalAlpha = given ? 1 : 0.35;
    ctx.fillStyle = colors.e1;
    ctx.globalAlpha *= 0.55;
    ctx.fillRect(bx, y(q.aGivenB), barW, H * q.aGivenB);
    ctx.globalAlpha = (given ? 1 : 0.35) * 0.22;
    ctx.fillRect(bx, top, barW, H * (1 - q.aGivenB));
    ctx.globalAlpha = given ? 1 : 0.35;
    ctx.strokeStyle = colors.e1;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, top, barW, H);
    ctx.fillStyle = colors.ink2;
    ctx.font = small;
    ctx.textAlign = "center";
    ctx.fillText(t.renorm, bx + barW / 2, top + H + 18);
    ctx.textAlign = "left";
    ctx.fillText(narrow ? q.aGivenB.toFixed(2) : `P(A|B) = ${q.aGivenB.toFixed(2)}`, bx + barW + 6, clamp(y(q.aGivenB) + 4, top + 10, top + H));
    // guide from B to its rescaled copy
    ctx.strokeStyle = colors.rule;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(left + W + 6, top + H / 2);
    ctx.lineTo(bx - 6, top + H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }, [colors, pA, pB, pAB, given, t, resize]);

  const preset = (kind: "independent" | "exclusive" | "inside") => {
    if (kind === "independent") setPAB(pA * pB);
    if (kind === "exclusive") {
      const b = Math.min(pB, Math.max(0.05, 1 - pA));
      setPB(b);
      setPAB(0);
    }
    if (kind === "inside") {
      const b = Math.min(pB, pA);
      setPB(b);
      setPAB(b);
    }
  };

  const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, cls = "") => (
    <label className="exp-control block">
      <div className="flex justify-between"><span>{label}</span><span className="mono">{value.toFixed(3)}</span></div>
      <input type="range" aria-valuetext={value.toFixed(3)} className={cls} min={min} max={max} step={0.001} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color={`color-mix(in srgb, var(--leo) 22%, transparent)`} square label={t.legendA} />
        <LegendItem color={`color-mix(in srgb, var(--e1) 60%, transparent)`} square label={t.legendAB} />
        <LegendItem color={`color-mix(in srgb, var(--e1) 25%, transparent)`} square label={t.legendBonly} />
        <LegendItem color="var(--accent-2)" dash="6 5" label={t.legendPB} />
      </ul>
      <canvas ref={canvasRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-3">
        {slider(t.pA, pA, setPA, 0.05, 0.95)}
        {slider(t.pB, pB, setPB, 0.05, 0.95, "e1")}
        {slider(t.pAB, pAB, setPAB, lo, hi, "e1")}
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-ghost btn-small" onClick={() => preset("independent")}>{t.independent}</button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => preset("exclusive")}>{t.exclusive}</button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => preset("inside")}>{t.inside}</button>
        <button type="button" className={`btn btn-ghost btn-small ml-auto ${given ? "border-ink" : ""}`} aria-pressed={given} onClick={() => setGiven((v) => !v)}>{t.condition}</button>
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span><span className="text-muted">{t.union}</span> <span className="mono text-ink">{k.union.toFixed(3)}</span></span>
        <span><span className="text-muted">P(B|A)</span> <span className="mono text-ink">{k.bGivenA.toFixed(3)}</span></span>
        <span><span className="text-muted">P(B|Aᶜ)</span> <span className="mono text-ink">{k.bGivenNotA.toFixed(3)}</span></span>
        <span><span className="text-muted">P(A|B)</span> <span className="mono text-e1">{k.aGivenB.toFixed(3)}</span></span>
        <span><span className="text-muted">{t.delta}</span> <span className="mono text-ink">{k.dependence.toFixed(3)}</span> <span className="text-muted">· {verdict}</span></span>
      </div>
    </div>
  );
}
