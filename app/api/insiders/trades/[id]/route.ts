import { getInsiderTrade } from "@/lib/server/insidersCache";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const trade = await getInsiderTrade(id);
  if (!trade) return jsonError("trade not found", 404);
  return jsonOk({ trade });
}
