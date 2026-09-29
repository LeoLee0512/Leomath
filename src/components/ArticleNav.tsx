"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/mdx";

/**
 * A reading navigator, not a progress bar: sections as stops on a line,
 * ● passed, ◐ current, ○ ahead. Learning is movement through structure.
 */
export function ArticleNav({ headings, label, variant = "vertical" }: { headings: Heading[]; label: string; variant?: "vertical" | "horizontal" }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => Boolean(e));
    if (els.length === 0) return;
    const update = () => {
      const line = 120; // px from the top of the viewport
      let cur: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) cur = el.id;
      }
      setCurrent(cur ?? els[0].id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  const idx = headings.findIndex((h) => h.id === current);
  const top = headings.filter((h) => h.depth === 2);

  if (variant === "horizontal") {
    return (
      <nav aria-label={label} className="flex gap-3 overflow-x-auto text-sm py-2 -mx-1 px-1">
        {top.map((h) => {
          const i = headings.indexOf(h);
          const state = i < idx ? "past" : i === idx ? "now" : "ahead";
          return (
            <a key={h.id} href={`#${h.id}`} aria-current={state === "now" ? "location" : undefined} className={`whitespace-nowrap ${state === "now" ? "text-ink font-medium" : state === "past" ? "text-ink-2" : "text-muted"}`}>
              <span aria-hidden="true" className="mr-1">{state === "now" ? "◐" : state === "past" ? "●" : "○"}</span>{h.text}
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label={label}>
      <p className="eyebrow mb-3">{label}</p>
      <ol className="relative ml-[5px] border-l border-rule-2 text-sm">
        {headings.map((h, i) => {
          const state = i < idx ? "past" : i === idx ? "now" : "ahead";
          return (
            <li key={h.id} className={`relative ${h.depth === 3 ? "pl-7" : "pl-4"} py-1`}>
              <span
                aria-hidden="true"
                className={`absolute -left-[5.5px] top-[9px] w-[10px] h-[10px] rounded-full border ${
                  state === "past" ? "bg-ink border-ink" : state === "now" ? "border-ink bg-[linear-gradient(90deg,var(--ink)_50%,var(--paper)_50%)]" : "bg-paper border-rule-2"
                }`}
              />
              <a href={`#${h.id}`} aria-current={state === "now" ? "location" : undefined} className={state === "now" ? "text-ink font-medium" : state === "past" ? "text-ink-2 hover:text-ink" : "text-muted hover:text-ink"}>
                {h.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
