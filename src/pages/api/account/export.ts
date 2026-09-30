import type { APIRoute } from "astro";
import { exportUserData } from "@/lib/account";

/** “Download my data”: the signed-in user's own records as a JSON file. */
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return new Response("Not signed in", { status: 401 });
  const data = await exportUserData(locals.user.id);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="leomath-data-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
};
