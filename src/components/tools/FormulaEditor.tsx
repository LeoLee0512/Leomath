"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { tex } from "@/lib/tex";
import { withBoundary } from "@/components/IslandBoundary";

const snippets = [
  { label: "a/b", tex: "\\frac{a}{b}" }, { label: "√", tex: "\\sqrt{x}" }, { label: "xⁿ", tex: "x^{n}" }, { label: "aₙ", tex: "a_{n}" },
  { label: "Σ", tex: "\\sum_{i=1}^{n}" }, { label: "∫", tex: "\\int_{a}^{b}" }, { label: "lim", tex: "\\lim_{n\\to\\infty}" }, { label: "∂", tex: "\\frac{\\partial f}{\\partial x}" },
  { label: "( )", tex: "\\left(\\right)" }, { label: "matrix", tex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" }, { label: "cases", tex: "\\begin{cases} x, & x\\ge 0 \\\\ -x, & x<0 \\end{cases}" },
  { label: "α β γ", tex: "\\alpha \\beta \\gamma \\theta \\lambda \\pi \\omega" }, { label: "ℝ", tex: "\\mathbb{R}" }, { label: "→", tex: "\\to" }, { label: "≤ ≥ ≠", tex: "\\le \\ge \\ne" },
];

const strings = {
  zh: { title: "公式编辑器", hint: "输入 LaTeX，右侧实时渲染。点击按钮插入常用结构。", copy: "复制 LaTeX", copied: "已复制", copyFail: "浏览器不允许自动复制，请手动选中复制。", display: "行间公式", inline: "行内公式" },
  en: { title: "Formula editor", hint: "Type LaTeX; it renders live. Click a button to insert a common structure.", copy: "Copy LaTeX", copied: "Copied", copyFail: "The browser blocked automatic copying; select and copy by hand.", display: "display", inline: "inline" },
};

function FormulaEditorIsland({ locale }: { locale: Locale }) {
  const t = strings[locale];
  const [src, setSrc] = useState("\\int_0^1 x^2\\,dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac13");
  const [display, setDisplay] = useState(true);
  const [msg, setMsg] = useState("");
  const html = useMemo(() => tex(src, display), [src, display]);
  const hasError = html.includes("temml-error");

  function insert(snippet: string) {
    setSrc((s) => (s.endsWith(" ") || s === "" ? s + snippet : s + " " + snippet));
  }
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(src);
      } else {
        const ta = document.createElement("textarea");
        ta.value = src;
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand failed");
      }
      setMsg(t.copied);
    } catch {
      setMsg(t.copyFail);
    }
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <section id="formula" className="exp-frame scroll-mt-24">
      <div className="px-4 py-3 border-b border-rule">
        <h2 className="display text-xl font-semibold">{t.title}</h2>
        <p className="text-sm text-muted mt-1">{t.hint}</p>
      </div>
      <div className="px-4 py-2.5 border-b border-rule flex flex-wrap gap-1.5">
        {snippets.map((s) => (
          <button key={s.label} type="button" className="btn btn-ghost btn-small mono" onClick={() => insert(s.tex)} title={s.tex}>{s.label}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2">
        <textarea
          className="field mono text-sm min-h-40 rounded-none border-0 border-b md:border-b-0 md:border-r border-rule resize-y"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          spellCheck={false}
          aria-label="LaTeX"
        />
        <div className={`p-5 overflow-x-auto min-h-40 flex items-center ${display ? "justify-center" : ""} ${hasError ? "text-e1" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div className="border-t border-rule px-4 py-2.5 flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2 exp-control"><input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} />{display ? t.display : t.inline}</label>
        <button type="button" className="btn btn-ghost btn-small" onClick={copy}>{t.copy}</button>
        {msg && <span className="text-muted">{msg}</span>}
      </div>
    </section>
  );
}

/** An error inside the FormulaEditor shows a message with a reload button instead of removing it from the page. */
export const FormulaEditor = withBoundary(FormulaEditorIsland);
