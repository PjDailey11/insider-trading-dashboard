"use client";

import { useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";
import type { Candle, CandleInterval } from "@/lib/types";

export interface CandlesQueryData {
  candles: Candle[];
  proxySymbol?: string;
  degraded?: boolean;
}

const DEFAULT_LIMIT = 300;

export function useCandles(
  symbol: string | undefined,
  interval: CandleInterval,
  opts?: { limit?: number },
) {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  return useQuery({
    queryKey: ["candles", symbol, interval, limit],
    queryFn: async (): Promise<CandlesQueryData> => {
      const result = await dataAdapter.candles.get(symbol!, interval, { limit });
      return {
        candles: result.candles,
        proxySymbol: result.proxySymbol,
        degraded: result.degraded,
      };
    },
    enabled: Boolean(symbol),
    staleTime: 60_000,
  });
}
