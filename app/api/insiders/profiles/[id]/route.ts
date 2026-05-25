import { getInsiderProfile, tradesForPolitician } from "@/lib/server/insidersCache";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const limit = new URL(req.url).searchParams.get("limit");
  const profile = await getInsiderProfile(id);
  if (!profile) return jsonError("profile not found", 404);
  const trades = await tradesForPolitician(id, {
    limit: limit ? parseInt(limit, 10) : 50,
  });
  return jsonOk({ profile, trades });
}
