import { NextRequest } from "next/server";
import { fetchQuote, ProviderError } from "@/lib/server/publicMarket";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";
import quotesSeed from "@/seed/quotes.json";
import type { Quote } from "@/lib/types";

export const runtime = "nodejs";

const mockQuotes = quotesSeed as Quote[];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase();
  if (!symbol) return jsonError("symbol required", 400);
  try {
    const quote = await fetchQuote(symbol);
    if (quote) return jsonOk({ quote });
    const fallback = mockQuotes.find((q) => q.symbol === symbol);
    if (fallback) return jsonOk({ quote: fallback, degraded: true });
    return jsonError("quote not found", 404);
  } catch (err) {
    if (err instanceof ProviderError) {
      const fallback = mockQuotes.find((q) => q.symbol === symbol);
      if (fallback) return jsonOk({ quote: fallback, degraded: true });
    }
    return jsonError("quote fetch failed", 500);
  }
}
