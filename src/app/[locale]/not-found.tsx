"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// not-found receives no params, so the locale is read from the URL.
const copy = {
  zh: { title: "页面不存在", body: "这个地址没有内容。可能是链接写错了，或者页面已经移动。", home: "回到首页", learn: "看看学习路线" },
  en: { title: "Page not found", body: "There is nothing at this address. The link may be wrong, or the page may have moved.", home: "Back to the home page", learn: "Browse the learning paths" },
};

export default function NotFound() {
  const locale = usePathname()?.startsWith("/en") ? "en" : "zh";
  const t = copy[locale];
  return (
    <div className="container section text-center">
      <p className="eyebrow">404</p>
      <h1 className="display text-3xl mt-3">{t.title}</h1>
      <p className="mt-4 text-ink-2">{t.body}</p>
      <p className="mt-8 flex justify-center gap-4">
        <Link href={`/${locale}`} className="btn btn-primary btn-small">{t.home}</Link>
        <Link href={`/${locale}/learn`} className="btn btn-ghost btn-small">{t.learn}</Link>
      </p>
    </div>
  );
}
