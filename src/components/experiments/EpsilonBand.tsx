"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Plot, fitCanvas } from "@/lib/plot";
import { format } from "@/lib/math/linear";
import { SEQUENCE_IDS, lastOutside, sequences, type SequenceId } from "@/lib/math/sequences";
import { useTex } from "./texContext";
import { useResizeVersion, useThemeColors } from "./useTheme";
import { useUrlState } from "./urlState";
import { LegendItem } from "./Legend";

/** How far we look for terms outside the band. Every sequence offered is inside for good by n = 1/ε² ≤ 2500. */
const CHECK = 100000;
const EPS_MIN = 0.02;
const EPS_MAX = 0.5;
const L_MIN = -1.5;
const L_MAX = 1.5;

const copy = {
  zh: {
    eps: "误差 ε", L: "候选极限 L", zoom: "放大到带子附近", toLimit: "L 放回极限",
    legendIn: "带内的项", legendOut: "带外的项", legendBand: "带子 (L − ε, L + ε)", legendN: "从 N 之后",
    found: (N: number) => (N === 0 ? "N = 0：所有项都在带内" : `N = ${N}：第 ${N} 项是最后一个跑出带子的项，n > ${N} 时都有 |aₙ − L| < ε`),
    notFound: `找不到 N：直到第 ${CHECK.toLocaleString("zh")} 项，仍有项跑出带子`,
    checked: `（已检查到第 ${CHECK.toLocaleString("zh")} 项）`,
    hint: "点是数列的各项，横轴是 n。带子是 L 上下各 ε 的范围。定义要求：从某个 N 起，所有项都留在带子里。缩小 ε，看 N 怎样变化。",
  },
  en: {
    eps: "error ε", L: "candidate limit L", zoom: "Zoom in on the band", toLimit: "Put L back at the limit",
    legendIn: "terms inside", legendOut: "terms outside", legendBand: "band (L − ε, L + ε)", legendN: "after N",
    found: (N: number) => (N === 0 ? "N = 0: every term is inside the band" : `N = ${N}: term ${N} is the last one outside the band; for n > ${N}, |aₙ − L| < ε`),
    notFound: `No N: terms still leave the band up to term ${CHECK.toLocaleString("en")}`,
    checked: `(checked up to term ${CHECK.toLocaleString("en")})`,
    hint: "The dots are the terms of the sequence against n. The band is everything within ε of L. The definition asks that from some N on, every term stays in the band. Shrink ε and watch N.",
  },
};

export function EpsilonBand({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const colors = useThemeColors();
  const defHtml = useTex("definition");
  const seqHtml = { ratio: useTex("ratio"), alternating: useTex("alternating"), sine: useTex("sine"), sign: useTex("sign") };
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resize = useResizeVersion(wrapRef);
  const [seq, setSeq] = useUrlState<SequenceId>("seq", "ratio", SEQUENCE_IDS);
  const [eps, setEps] = useUrlState("eps", 0.1, { min: EPS_MIN, max: EPS_MAX });
  const [L, setL] = useUrlState("L", 1, { min: L_MIN, max: L_MAX });
  const [zoom, setZoom] = useUrlState("zoom", false);
  const { term, limit } = sequences[seq];
  const last = useMemo(() => lastOutside(term, L, eps, CHECK), [term, L, eps]);
  const found = last < CHECK / 2;
  // Show a little beyond N, so the reader sees terms staying inside.
  const nShow = found ? Math.min(3000, Math.max(30, Math.ceil(last * 1.3) + 8)) : 60;

  const chooseSeq = (id: SequenceId) => {
    setSeq(id);
    setL(sequences[id].limit ?? 0);
  };

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const narrow = (el.clientWidth || 600) < 520;
    const { width, height, ctx } = fitCanvas(el, narrow ? 1.4 : 2);
    ctx.clearRect(0, 0, width, height);
    const font = "11px ui-sans-serif, system-ui";
    const terms = Array.from({ length: nShow }, (_, i) => term(i + 1));
    let lo = Math.min(L - eps, ...terms);
    let hi = Math.max(L + eps, ...terms);
    if (zoom) {
      lo = L - 3 * eps;
      hi = L + 3 * eps;
    }
    const padY = (hi - lo) * 0.08;
    const left = 40;
    const xSpan = nShow + 1;
    const plot = new Plot(ctx, width, height, [-xSpan * (left / (width - left)), nShow + 1], [lo - padY - (hi - lo) * 0.08, hi + padY]);
    const yLo = lo - padY;

    // Band and candidate limit.
    ctx.save();
    ctx.fillStyle = colors.leo;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(plot.x(0), plot.y(L + eps), plot.x(nShow + 1) - plot.x(0), plot.y(L - eps) - plot.y(L + eps));
    if (found) {
      // Everything after N lies in the band: tint that part more strongly.
      ctx.fillStyle = colors.e2;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(plot.x(last + 0.5), plot.y(L + eps), plot.x(nShow + 1) - plot.x(last + 0.5), plot.y(L - eps) - plot.y(L + eps));
    }
    ctx.restore();
    plot.polyline([[0, L + eps], [nShow + 1, L + eps]], colors.leo, 1);
    plot.polyline([[0, L - eps], [nShow + 1, L - eps]], colors.leo, 1);
    plot.polyline([[0, L], [nShow + 1, L]], colors.leo, 1, [5, 4]);
    plot.label("L", 0, L, colors.leo, -14, 4, font);
    plot.label(`L+ε`, 0, L + eps, colors.muted, -34, -2, font);
    plot.label(`L−ε`, 0, L - eps, colors.muted, -34, 10, font);

    // n axis.
    ctx.save();
    ctx.strokeStyle = colors.gridStrong;
    ctx.beginPath();
    ctx.moveTo(plot.x(0), plot.y(yLo));
    ctx.lineTo(plot.x(nShow + 1), plot.y(yLo));
    ctx.stroke();
    ctx.restore();
    const tickStep = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((s) => nShow / s <= Math.max(4, width / 70)) ?? 1000;
    for (let n = tickStep; n <= nShow; n += tickStep) plot.label(String(n), n, yLo, colors.muted, -6, 14, font);

    if (found && last > 0) {
      plot.polyline([[last + 0.5, yLo], [last + 0.5, hi + padY]], colors.e2, 1.4, [4, 3]);
      plot.label(`N = ${last}`, last + 0.5, hi + padY, colors.e2, 5, 13, "600 12px ui-sans-serif, system-ui");
    }

    // Terms: outside the band in red and larger; in zoom mode, terms beyond the view sit on its edge as rings.
    const r = Math.max(1, Math.min(3.6, ((width - left) / nShow) * 0.35));
    terms.forEach((a, i) => {
      const n = i + 1;
      const out = Math.abs(a - L) >= eps * (1 - 1e-12);
      const clipped = a < yLo || a > hi + padY;
      const y = clipped ? (a > hi ? hi + padY : yLo) : a;
      if (clipped) {
        ctx.save();
        ctx.strokeStyle = colors.e1;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(plot.x(n), plot.y(y), r + 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else plot.dot(n, y, out ? colors.e1 : colors.ink2, out ? r + 0.6 : r);
    });
  }, [colors, eps, found, L, last, nShow, term, zoom]);

  useEffect(() => { draw(); }, [draw, resize]);

  const logEps = Math.log10(eps);

  return (
    <div ref={wrapRef} className="exp-frame">
      <ul className="px-4 py-2.5 border-b border-rule flex flex-wrap items-center gap-x-5 gap-y-1.5 exp-control">
        <LegendItem color="var(--ink-2)" dot label={t.legendIn} />
        <LegendItem color="var(--e1)" dot label={t.legendOut} />
        <LegendItem color="color-mix(in srgb, var(--leo) 22%, transparent)" square label={t.legendBand} />
        {found && last > 0 && <LegendItem color="var(--e2)" dash="4 3" label={t.legendN} />}
      </ul>
      <canvas ref={canvasRef} className="exp-canvas" role="img" aria-label={t.hint} />
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2 exp-control">
        {SEQUENCE_IDS.map((id) => (
          <button key={id} type="button" className={`btn btn-ghost btn-small ${seq === id ? "border-ink" : ""}`} aria-pressed={seq === id} onClick={() => chooseSeq(id)}>
            <span dangerouslySetInnerHTML={{ __html: seqHtml[id] }} />
          </button>
        ))}
      </div>
      <div className="border-t border-rule px-4 py-3 grid gap-x-6 gap-y-3 md:grid-cols-2">
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.eps}</span><span className="mono">{format(eps, 3)}</span></div>
          <input type="range" className="e1" min={Math.log10(EPS_MIN)} max={Math.log10(EPS_MAX)} step={0.005} value={logEps} aria-valuetext={`ε = ${format(eps, 3)}`} onChange={(e) => setEps(Math.round(10 ** Number(e.target.value) * 1000) / 1000)} />
        </label>
        <label className="exp-control block">
          <div className="flex justify-between"><span>{t.L}</span><span className="mono">{format(L, 2)}</span></div>
          <input type="range" min={L_MIN} max={L_MAX} step={0.01} value={L} aria-valuetext={`L = ${format(L, 2)}`} onChange={(e) => setL(Number(e.target.value))} />
        </label>
      </div>
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-2 exp-control">
        <button type="button" className={`btn btn-ghost btn-small ${zoom ? "border-ink" : ""}`} aria-pressed={zoom} onClick={() => setZoom((z) => !z)}>{t.zoom}</button>
        {limit !== null && Math.abs(L - limit) > 1e-9 && (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setL(limit)}>{t.toLimit}</button>
        )}
      </div>
      <div className="border-t border-rule px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 exp-control">
        <span dangerouslySetInnerHTML={{ __html: defHtml }} />
        <span aria-live="polite" className={found ? "text-e2" : "text-e1"}>
          {found ? t.found(last) : t.notFound} {found && <span className="text-muted">{t.checked}</span>}
        </span>
      </div>
    </div>
  );
}
