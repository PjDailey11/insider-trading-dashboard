"use client";

import { useQuery } from "@tanstack/react-query";
import { dataAdapter } from "@/lib/adapters";
import type { NewsFilter } from "@/lib/adapters";

export function useNews(filter: NewsFilter = {}) {
  return useQuery({
    queryKey: ["news", filter],
    queryFn: () => dataAdapter.news.list(filter),
    staleTime: 30_000,
  });
}
