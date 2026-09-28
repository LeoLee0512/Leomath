"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";

interface Item { slug: string; title: string; summary: string }

export function ConceptSearch({ locale, items, placeholder }: { locale: Locale; items: Item[]; placeholder: string }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.title.toLowerCase().includes(s) || i.summary.toLowerCase().includes(s) || i.slug.includes(s));
  }, [q, items]);
  return (
    <div>
      <input
        type="search"
        className="field"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={placeholder}
      />
      <ul className="mt-4 divide-y divide-rule border-y border-rule">
        {results.map((i) => (
          <li key={i.slug}>
            <Link href={`/${locale}/concepts/${i.slug}`} className="flex flex-col gap-0.5 py-3 hover:text-leo">
              <span className="font-medium">{i.title}</span>
              <span className="text-sm text-muted">{i.summary}</span>
            </Link>
          </li>
        ))}
        {results.length === 0 && <li className="py-3 text-muted text-sm">—</li>}
      </ul>
    </div>
  );
}
