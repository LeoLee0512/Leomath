"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { apply, det, eigen, format, multiply, trace, type Mat2 } from "@/lib/math/linear";
import { tex } from "@/lib/tex";
import { withBoundary } from "@/components/IslandBoundary";

const copy = {
  zh: { title: "2×2 矩阵计算器", hint: "输入矩阵 A 与向量 v。行列式、迹、逆、特征值与特征向量、Av 与 A² 都实时计算。", singular: "A 不可逆（行列式为 0）", complex: "复特征值：没有实特征方向" },
  en: { title: "2×2 matrix calculator", hint: "Enter a matrix A and a vector v. Determinant, trace, inverse, eigenvalues/eigenvectors, Av and A² update live.", singular: "A is singular (determinant 0)", complex: "complex eigenvalues: no real eigen-direction" },
};

function num(s: string): number {
  const v = Number(s.trim().replace("−", "-"));
  return Number.isFinite(v) ? v : 0;
}

function MatrixToolIsland({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [cells, setCells] = useState(["2", "1", "1", "2"]);
  const [vec, setVec] = useState(["1", "0"]);
  const m = useMemo<Mat2>(() => [num(cells[0]), num(cells[1]), num(cells[2]), num(cells[3])], [cells]);
  const v = useMemo<[number, number]>(() => [num(vec[0]), num(vec[1])], [vec]);
  const d = det(m);
  const e = useMemo(() => eigen(m), [m]);
  const inv: Mat2 | null = Math.abs(d) > 1e-12 ? [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d] : null;
  const av = apply(m, v);
  const m2 = multiply(m, m);
  const mat = (x: Mat2) => `\\begin{pmatrix}${format(x[0], 3)}&${format(x[1], 3)}\\\\${format(x[2], 3)}&${format(x[3], 3)}\\end{pmatrix}`;
  const col = (x: readonly number[]) => `\\begin{pmatrix}${format(x[0], 3)}\\\\${format(x[1], 3)}\\end{pmatrix}`;
  const input = "field mono text-sm text-center w-16 py-1";

  return (
    <section id="matrix" className="exp-frame scroll-mt-24">
      <div className="px-4 py-3 border-b border-rule">
        <h2 className="display text-xl font-semibold">{t.title}</h2>
        <p className="text-sm text-muted mt-1">{t.hint}</p>
      </div>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <span className="display text-xl italic">A =</span>
          <div className="grid grid-cols-2 gap-1.5">
            {cells.map((c, i) => <input key={i} className={input} value={c} onChange={(ev) => setCells(cells.map((x, j) => (j === i ? ev.target.value : x)))} aria-label={`a${i}`} />)}
          </div>
          <span className="display text-xl italic ml-2">v =</span>
          <div className="grid gap-1.5">
            {vec.map((c, i) => <input key={i} className={input} value={c} onChange={(ev) => setVec(vec.map((x, j) => (j === i ? ev.target.value : x)))} aria-label={`v${i}`} />)}
          </div>
        </div>
        <div className="grid gap-x-10 gap-y-4 md:grid-cols-2 text-base border-t border-rule pt-5 overflow-x-auto">
          <div dangerouslySetInnerHTML={{ __html: tex(`\\det A = ${format(d, 4)},\\quad \\operatorname{tr} A = ${format(trace(m), 4)}`) }} />
          <div dangerouslySetInnerHTML={{ __html: tex(`Av = ${col(av)}`) }} />
          <div dangerouslySetInnerHTML={{ __html: inv ? tex(`A^{-1} = ${mat(inv)}`) : tex(`\\text{${t.singular}}`) }} />
          <div dangerouslySetInnerHTML={{ __html: tex(`A^{2} = ${mat(m2)}`) }} />
          <div className="sm:col-span-2" dangerouslySetInnerHTML={{ __html: e.complex
            ? tex(`\\lambda = ${format(e.re!, 4)} \\pm ${format(e.im!, 4)}i\\quad\\text{(${t.complex})}`)
            : tex(`\\lambda_1 = ${format(e.values![0], 4)},\\ v_1 = ${col(e.vectors![0])};\\qquad \\lambda_2 = ${format(e.values![1], 4)},\\ v_2 = ${col(e.vectors![1])}`) }} />
          <div className="sm:col-span-2 text-sm text-muted" dangerouslySetInnerHTML={{ __html: tex(`\\lambda^2 - (\\operatorname{tr}A)\\lambda + \\det A = \\lambda^2 ${trace(m) < 0 ? "+" : "-"} ${format(Math.abs(trace(m)), 4)}\\lambda ${d < 0 ? "-" : "+"} ${format(Math.abs(d), 4)}`) }} />
        </div>
      </div>
    </section>
  );
}

/** An error inside the MatrixTool shows a message with a reload button instead of removing it from the page. */
export const MatrixTool = withBoundary(MatrixToolIsland);
