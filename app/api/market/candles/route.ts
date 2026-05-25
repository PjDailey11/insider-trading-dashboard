import { NextRequest } from "next/server";
import { fetchCandles, ProviderError } from "@/lib/server/publicMarket";
import { resolveInstrumentSymbol } from "@/lib/server/instrumentMap";
import { jsonError, jsonOk } from "@/lib/server/apiResponse";
import type { Candle, CandleInterval } from "@/lib/types";
import candlesDailySeed from "@/seed/candlesDaily.json";

export const runtime = "nodejs";

const candlesDaily = candlesDailySeed as Record<string, Candle[]>;
const VALID: CandleInterval[] = ["1m", "5m", "15m", "1h", "1d", "1w"];

function sliceSeed(rows: Candle[], limit?: number): Candle[] {
  return limit ? rows.slice(-limit) : rows;
}

function seedFallback(
  displaySymbol: string,
  resolvedSymbol: string,
  limit?: number,
): { candles: Candle[]; proxySymbol?: string } {
  const direct = candlesDaily[displaySymbol] ?? [];
  if (direct.length > 0) {
    return { candles: sliceSeed(direct, limit) };
  }
  if (resolvedSymbol !== displaySymbol) {
    const proxy = candlesDaily[resolvedSymbol] ?? [];
    if (proxy.length > 0) {
      return { candles: sliceSeed(proxy, limit), proxySymbol: resolvedSymbol };
    }
  }
  return { candles: [] };
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase();
  const interval = (req.nextUrl.searchParams.get("interval") ?? "1d") as CandleInterval;
  const limit = req.nextUrl.searchParams.get("limit");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!symbol) return jsonError("symbol required", 400);
  if (!VALID.includes(interval)) return jsonError("invalid interval", 400);
  const resolved = resolveInstrumentSymbol(symbol);
  const opts = {
    limit: limit ? parseInt(limit, 10) : undefined,
    from: from ? parseInt(from, 10) : undefined,
    to: to ? parseInt(to, 10) : undefined,
  };

  const respondWithSeed = () => {
    const { candles, proxySymbol } = seedFallback(symbol, resolved, opts.limit);
    return jsonOk({
      candles,
      degraded: true,
      ...(proxySymbol ? { proxySymbol } : {}),
    });
  };

  try {
    const candles = await fetchCandles(symbol, interval, opts);
    if (candles.length > 0) {
      const proxySymbol = resolved !== symbol ? resolved : undefined;
      return jsonOk({
        candles,
        ...(proxySymbol ? { proxySymbol } : {}),
      });
    }
    return respondWithSeed();
  } catch (err) {
    if (err instanceof ProviderError) {
      return respondWithSeed();
    }
    return jsonError("candles fetch failed", 500);
  }
}
