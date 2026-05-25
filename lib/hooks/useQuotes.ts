"use client";

import { useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";

export function useQuote(symbol: string | undefined) {
  return useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => dataAdapter.quotes.get(symbol!),
    enabled: Boolean(symbol),
    staleTime: 15_000,
  });
}

export function useQuotes(symbols: string[]) {
  return useQuery({
    queryKey: ["quotes", symbols.slice().sort().join(",")],
    queryFn: () => dataAdapter.quotes.batch(symbols),
    enabled: symbols.length > 0,
    staleTime: 15_000,
  });
}
