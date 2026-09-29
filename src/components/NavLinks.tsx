"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Desktop section links; the current section is marked for sight and for screen readers. */
export function NavLinks({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className="hidden md:flex items-center gap-5 text-sm text-ink-2" aria-label={label}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={current ? "text-ink font-medium" : "hover:text-ink"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
