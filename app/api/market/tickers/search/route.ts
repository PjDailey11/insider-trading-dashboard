import { NextRequest } from "next/server";
import { searchTickers, ProviderError } from "@/lib/server/publicMarket";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";
import tickersSeed from "@/seed/tickers.json";
import type { Ticker } from "@/lib/types";

export const runtime = "nodejs";

const mockTickers = tickersSeed as Ticker[];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "12", 10);
  try {
    const items = await searchTickers(q, limit);
    if (items.length > 0) return jsonOk({ items });
    const upper = q.trim().toUpperCase();
    const fallback = mockTickers
      .filter(
        (t) =>
          !upper ||
          t.symbol.startsWith(upper) ||
          t.name.toUpperCase().includes(upper),
      )
      .slice(0, limit);
    return jsonOk({ items: fallback, degraded: true });
  } catch (err) {
    if (err instanceof ProviderError) {
      const upper = q.trim().toUpperCase();
      const fallback = mockTickers
        .filter(
          (t) =>
            !upper ||
            t.symbol.startsWith(upper) ||
            t.name.toUpperCase().includes(upper),
        )
        .slice(0, limit);
      return jsonOk({ items: fallback, degraded: true });
    }
    return jsonError("ticker search failed", 500);
  }
}
