"use client";

import { useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";

export function usePoliticians() {
  return useQuery({
    queryKey: ["politicians"],
    queryFn: () => dataAdapter.politicians.list(),
    staleTime: 5 * 60_000,
  });
}

export function usePolitician(id: string | undefined) {
  return useQuery({
    queryKey: ["politician", id],
    queryFn: () => dataAdapter.politicians.get(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}
