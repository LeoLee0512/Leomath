// Receives Content-Security-Policy violation reports and writes a one-line summary to the server log,
// so the report-only policy can be checked (docker compose logs web) before it is enforced.
const MAX_BYTES = 8 * 1024;

export async function POST(request: Request): Promise<Response> {
  try {
    const text = (await request.text()).slice(0, MAX_BYTES);
    const body = JSON.parse(text) as { "csp-report"?: Record<string, unknown> };
    const r = body["csp-report"] ?? {};
    const pick = (k: string) => String(r[k] ?? "").slice(0, 200);
    console.warn(`[csp] ${pick("violated-directive") || pick("effective-directive")} blocked=${pick("blocked-uri")} page=${pick("document-uri")}`);
  } catch {
    // Malformed or oversized reports are ignored.
  }
  return new Response(null, { status: 204 });
}
