"use client";

import { useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";

export function useTickers() {
  return useQuery({
    queryKey: ["tickers"],
    queryFn: () => dataAdapter.tickers.list(),
    staleTime: 5 * 60_000,
  });
}

export function useTickerSearch(query: string, limit = 12) {
  return useQuery({
    queryKey: ["tickers", "search", query, limit],
    queryFn: () => dataAdapter.tickers.search(query, limit),
    staleTime: 30_000,
  });
}

export function useTicker(symbol: string | undefined) {
  return useQuery({
    queryKey: ["ticker", symbol],
    queryFn: () => dataAdapter.tickers.get(symbol!),
    enabled: Boolean(symbol),
    staleTime: 5 * 60_000,
  });
}
