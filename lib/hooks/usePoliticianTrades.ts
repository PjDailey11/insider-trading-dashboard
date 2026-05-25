"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";
import type { PoliticianTradeFilter } from "@/lib/adapters";

export function usePoliticianTrades(filter: PoliticianTradeFilter = {}) {
  return useInfiniteQuery({
    queryKey: ["politicianTrades", filter],
    queryFn: ({ pageParam }) =>
      dataAdapter.politicianTrades.list({ ...filter, cursor: pageParam, limit: filter.limit ?? 24 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}

export function usePoliticianTradesForSymbol(
  symbol: string | undefined,
  opts?: { since?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["politicianTrades", "forSymbol", symbol, opts?.since ?? null, opts?.limit ?? null],
    queryFn: () => dataAdapter.politicianTrades.forSymbol(symbol!, opts),
    enabled: Boolean(symbol),
    staleTime: 60_000,
  });
}

export function usePoliticianTradesForPolitician(
  politicianId: string | undefined,
  limit?: number,
) {
  return useQuery({
    queryKey: ["politicianTrades", "forPolitician", politicianId, limit ?? null],
    queryFn: () => dataAdapter.politicianTrades.forPolitician(politicianId!, { limit }),
    enabled: Boolean(politicianId),
    staleTime: 60_000,
  });
}
