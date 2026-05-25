"use client";

import { cn } from "@/lib/utils";
import { formatPercent, formatPrice, trendSign } from "@/lib/utils/format";

export interface MarketStatPillProps {
  symbol: string;
  label?: string;
  price: number | undefined;
  changePct: number | undefined;
  digits?: number;
  stale?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function MarketStatPill({
  symbol,
  label,
  price,
  changePct,
  digits = 2,
  stale,
  onClick,
  compact,
}: MarketStatPillProps) {
  const trend = changePct !== undefined ? trendSign(changePct) : "flat";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex shrink-0 items-center gap-1.5 px-2 py-1",
        "hover:bg-bg-overlay transition-colors",
        onClick && "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "font-mono text-2xs uppercase tracking-wider text-text-muted",
          "group-hover:text-text",
          compact ? "" : "min-w-[36px] text-left",
        )}
      >
        {label ?? symbol}
      </span>
      <span
        className="tabular font-mono text-xs font-medium text-text"
        data-tabular="true"
      >
        {price === undefined ? "—" : formatPrice(price, digits)}
      </span>
      <span
        className={cn(
          "tabular font-mono text-2xs font-medium",
          trend === "up" && "num-up",
          trend === "down" && "num-down",
          trend === "flat" && "num-flat",
        )}
        data-tabular="true"
      >
        {changePct === undefined ? "—" : formatPercent(changePct)}
      </span>
      {stale ? (
        <span className="rounded-sm border border-warn/30 bg-warn-subtle px-1 text-2xs uppercase tracking-wider text-warn">
          stale
        </span>
      ) : null}
    </button>
  );
}
