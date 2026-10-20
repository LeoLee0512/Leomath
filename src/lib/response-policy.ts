/** Preserve upstream negotiation tokens, including Accept-Encoding added by compression. */
export function varyOn(headers: Headers, ...fields: string[]) {
  const existing = (headers.get("Vary") ?? "").split(",").map(v => v.trim()).filter(Boolean);
  if (existing.includes("*")) return;
  for (const field of fields) if (!existing.some(v => v.toLowerCase() === field.toLowerCase())) existing.push(field);
  headers.set("Vary", existing.join(", "));
}

/** SSR includes account state and learning progress; never store HTML in shared or browser caches. */
export function htmlResponsePolicy(headers: Headers) {
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "private, no-store");
  varyOn(headers, "Cookie");
}

export function localeRedirectPolicy(headers: Headers) {
  headers.set("Cache-Control", "private, no-store");
  varyOn(headers, "Accept-Language", "Cookie");
}
