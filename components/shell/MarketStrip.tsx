"use client";

import { useRouter } from "next/navigation";
import { MarketStatPill } from "@/components/market/MarketStatPill";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { Skeleton } from "@/components/ui/skeleton";
import { Circle } from "lucide-react";

const STRIP_SYMBOLS = [
  "SPX",
  "NDX",
  "DJI",
  "RUT",
  "VIX",
  "US10Y",
  "US02Y",
  "DXY",
  "GOLD",
  "WTI",
  "BTC",
  "ETH",
];

const LABELS: Record<string, string> = {
  SPX: "S&P",
  NDX: "NDX",
  DJI: "DOW",
  RUT: "RUT",
  VIX: "VIX",
  US10Y: "10Y",
  US02Y: "2Y",
  DXY: "DXY",
  GOLD: "GLD",
  WTI: "WTI",
  BTC: "BTC",
  ETH: "ETH",
};

export function MarketStrip() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuotes(STRIP_SYMBOLS);

  return (
    <div className="flex h-strip shrink-0 items-center gap-px border-b border-border bg-bg-sunken overflow-x-auto">
      <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border px-3 text-2xs uppercase tracking-wider text-text-muted">
        <Circle className="h-1.5 w-1.5 fill-gain text-gain" />
        <span>Markets Open</span>
      </div>

      {isLoading ? (
        <div className="flex gap-px">
          {STRIP_SYMBOLS.map((s) => (
            <Skeleton key={s} className="ml-px h-strip w-[120px] rounded-none" />
          ))}
        </div>
      ) : isError ? (
        <span className="px-3 text-xs text-loss">market data unavailable</span>
      ) : (
        (data ?? []).map((q) => (
          <MarketStatPill
            key={q.symbol}
            symbol={q.symbol}
            label={LABELS[q.symbol] ?? q.symbol}
            price={q.last}
            changePct={q.changePct}
            digits={
              q.symbol === "BTC" || q.symbol === "ETH"
                ? q.last > 1000
                  ? 0
                  : 2
                : q.symbol === "US10Y" || q.symbol === "US02Y" || q.symbol === "VIX"
                  ? 2
                  : 2
            }
            stale={q.stale}
            onClick={() => router.push(`/s/${q.symbol}`)}
          />
        ))
      )}

      <div className="ml-auto flex h-full shrink-0 items-center gap-2 border-l border-border px-3 text-2xs uppercase tracking-wider text-text-subtle">
        <span>Data: Mock</span>
      </div>
    </div>
  );
}
