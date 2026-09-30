import type { APIRoute } from "astro";
import { locales } from "@/i18n/config";
import { experiments, paths, publishedConcepts } from "@/content/graph";
import { software } from "@/content/software";
import { SITE_URL, languageAlternates } from "@/lib/seo";

/** Every public page in both languages, each entry listing its translations. */
export const GET: APIRoute = () => {
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
  const urls = pages.flatMap(({ path, priority }) => {
    const alternates = Object.entries(languageAlternates(path))
      .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${href}"/>`)
      .join("");
    return locales.map((l) => `<url><loc>${SITE_URL}/${l}${path}</loc>${alternates}<changefreq>weekly</changefreq><priority>${priority}</priority></url>`);
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
