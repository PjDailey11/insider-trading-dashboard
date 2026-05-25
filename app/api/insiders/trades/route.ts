import { NextRequest } from "next/server";
import { listInsiderTrades } from "@/lib/server/insidersCache";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";
import type { AmountBucket, TradeSide } from "@/lib/types";
import type { PoliticianTradeFilter } from "@/lib/adapters/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  try {
    const filter: PoliticianTradeFilter = {
      symbol: p.get("symbol") ?? undefined,
      politicianId: p.get("politicianId") ?? undefined,
      cursor: p.get("cursor") ?? undefined,
      limit: p.get("limit") ? parseInt(p.get("limit")!, 10) : undefined,
      since: p.get("since") ? parseInt(p.get("since")!, 10) : undefined,
      minAmount: (p.get("minAmount") as AmountBucket | null) ?? undefined,
      sides: p.getAll("side") as TradeSide[],
      roles: p.getAll("role"),
    };
    if (filter.sides?.length === 0) delete filter.sides;
    if (filter.roles?.length === 0) delete filter.roles;
    const result = await listInsiderTrades(filter);
    return jsonOk(result);
  } catch {
    return jsonError("insider trades fetch failed", 500);
  }
}
