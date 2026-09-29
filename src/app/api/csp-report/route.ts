// Receives Content-Security-Policy violation reports and writes a one-line summary to the server log,
// so the report-only policy can be checked (docker compose logs web) before it is enforced.
// Anyone can post here, so the input is treated as hostile: only real report types, small bodies,
// no control characters in the log (no forged lines, no terminal escape codes).
const MAX_BYTES = 8 * 1024;
const TYPES = ["application/csp-report", "application/reports+json", "application/json"];

const clean = (v: unknown) => String(v ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").slice(0, 200);

export async function POST(request: Request): Promise<Response> {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const length = Number(request.headers.get("content-length") ?? "0");
  if (!TYPES.includes(type) || length > MAX_BYTES) return new Response(null, { status: 204 });
  try {
    const text = (await request.text()).slice(0, MAX_BYTES);
    const parsed = JSON.parse(text) as unknown;
    // Two formats: { "csp-report": {...} } (report-uri) or [{ body: {...} }] (Reporting API).
    const r = ((parsed as { "csp-report"?: Record<string, unknown> })["csp-report"] ??
      (Array.isArray(parsed) ? (parsed[0] as { body?: Record<string, unknown> })?.body : undefined) ??
      {}) as Record<string, unknown>;
    const directive = clean(r["violated-directive"] ?? r["effective-directive"] ?? r.effectiveDirective);
    console.warn(`[csp] ${directive} blocked=${clean(r["blocked-uri"] ?? r.blockedURL)} page=${clean(r["document-uri"] ?? r.documentURL)}`);
  } catch {
    // Malformed reports are ignored.
  }
  return new Response(null, { status: 204 });
}
