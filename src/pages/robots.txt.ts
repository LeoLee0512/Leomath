import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/seo";

const PRIVATE = ["account", "login", "register"];

export const GET: APIRoute = () =>
  new Response(
    [
      "User-Agent: *",
      "Allow: /",
      ...["zh", "en"].flatMap((l) => PRIVATE.map((p) => `Disallow: /${l}/${p}`)),
      "",
      `Host: ${SITE_URL}`,
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
