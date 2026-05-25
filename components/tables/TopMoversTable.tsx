"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTickers } from "@/lib/hooks/useTickers";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { formatPrice, formatPercent, formatVolume } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface TopMoversTableProps {
  direction: "gainers" | "losers" | "actives";
  limit?: number;
}

export function TopMoversTable({ direction, limit = 10 }: TopMoversTableProps) {
  const { data: tickers } = useTickers();
  const symbols = useMemo(
    () =>
      (tickers ?? [])
        .filter((t) => t.exchange !== "INDEX" && t.exchange !== "BOND" && t.exchange !== "FX")
        .map((t) => t.symbol),
    [tickers],
  );
  const { data: quotes, isLoading } = useQuotes(symbols);

  const sorted = useMemo(() => {
    if (!quotes) return [];
    const arr = quotes.slice();
    if (direction === "gainers") arr.sort((a, b) => b.changePct - a.changePct);
    else if (direction === "losers") arr.sort((a, b) => a.changePct - b.changePct);
    else arr.sort((a, b) => b.volume - a.volume);
    return arr.slice(0, limit);
  }, [quotes, direction, limit]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0.5 p-2">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid h-7 grid-cols-[80px_minmax(0,1fr)_80px_70px_80px] items-center border-b border-border bg-bg-sunken px-3 text-2xs uppercase tracking-wider text-text-muted">
        <span>Sym</span>
        <span className="truncate">Name</span>
        <span className="text-right">Last</span>
        <span className="text-right">Chg %</span>
        <span className="text-right">Vol</span>
      </div>
      {sorted.map((q) => {
        const ticker = tickers?.find((t) => t.symbol === q.symbol);
        return (
          <Link
            key={q.symbol}
            href={`/s/${q.symbol}`}
            className="grid h-7 grid-cols-[80px_minmax(0,1fr)_80px_70px_80px] items-center border-b border-border-muted px-3 text-xs row-hover"
          >
            <span className="font-mono font-medium text-text">{q.symbol}</span>
            <span className="truncate text-text-muted">{ticker?.name ?? "—"}</span>
            <span className="text-right font-mono tabular text-text" data-tabular="true">
              {formatPrice(q.last)}
            </span>
            <span
              className={cn(
                "text-right font-mono tabular",
                q.changePct > 0 ? "num-up" : q.changePct < 0 ? "num-down" : "num-flat",
              )}
              data-tabular="true"
            >
              {formatPercent(q.changePct)}
            </span>
            <span className="text-right font-mono tabular text-text-muted" data-tabular="true">
              {formatVolume(q.volume)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
