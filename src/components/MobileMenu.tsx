"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Phone navigation: one button in the header row that opens the section list, instead of a second scrolling row. */
export function MobileMenu({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close after navigating, and on Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:text-ink hover:bg-paper-2"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {open ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-14 border-b border-rule bg-paper shadow-sm">
          <nav className="container py-2" aria-label={label}>
            <ul>
              {items.map((item) => {
                const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href} className="border-b border-rule last:border-b-0">
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={`block py-2.5 text-[0.95rem] ${current ? "text-leo" : "text-ink-2 hover:text-ink"}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
