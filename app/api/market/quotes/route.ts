import { NextRequest } from "next/server";
import { fetchQuotes, ProviderError } from "@/lib/server/polygon";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";
import quotesSeed from "@/seed/quotes.json";
import type { Quote } from "@/lib/types";

export const runtime = "nodejs";

const mockQuotes = quotesSeed as Quote[];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols");
  if (!raw) return jsonError("symbols required", 400);
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (symbols.length === 0) return jsonError("symbols required", 400);
  try {
    const quotes = await fetchQuotes(symbols);
    if (quotes.length > 0) return jsonOk({ quotes });
    const fallback = mockQuotes.filter((q) => symbols.includes(q.symbol));
    return jsonOk({ quotes: fallback, degraded: true });
  } catch (err) {
    if (err instanceof ProviderError) {
      const fallback = mockQuotes.filter((q) => symbols.includes(q.symbol));
      return jsonOk({ quotes: fallback, degraded: true });
    }
    return jsonError("quotes fetch failed", 500);
  }
}
