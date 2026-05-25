"use client";

import { useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";
import type { CandleInterval } from "@/lib/types";

export function useCandles(
  symbol: string | undefined,
  interval: CandleInterval,
  opts?: { limit?: number },
) {
  return useQuery({
    queryKey: ["candles", symbol, interval, opts?.limit ?? null],
    queryFn: () =>
      dataAdapter.candles.get(symbol!, interval, opts?.limit ? { limit: opts.limit } : undefined),
    enabled: Boolean(symbol),
    staleTime: 60_000,
  });
}
