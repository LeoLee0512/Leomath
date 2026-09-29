import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { experiments, paths, publishedConcepts } from "@/content/graph";
import { software } from "@/content/software";
import { SITE_URL, languageAlternates } from "@/lib/seo";

/** Every public page in both languages, each entry listing its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/learn", priority: 0.9 },
    ...paths.map((p) => ({ path: `/learn/${p.slug}`, priority: 0.9 })),
    ...publishedConcepts().map((c) => ({ path: `/concepts/${c.slug}`, priority: 0.8 })),
    { path: "/explore", priority: 0.7 },
    ...experiments.map((e) => ({ path: `/explore/${e.slug}`, priority: 0.7 })),
    { path: "/problems", priority: 0.6 },
    { path: "/tools", priority: 0.6 },
    { path: "/software", priority: 0.4 },
    ...software.map((s) => ({ path: `/software/${s.slug}`, priority: 0.3 })),
    { path: "/about", priority: 0.4 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
  ];
  const absolute = (rel: Record<string, string>) => Object.fromEntries(Object.entries(rel).map(([k, v]) => [k, `${SITE_URL}${v}`]));
  return pages.flatMap(({ path, priority }) =>
    locales.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages: absolute(languageAlternates(path)) },
    })),
  );
}
