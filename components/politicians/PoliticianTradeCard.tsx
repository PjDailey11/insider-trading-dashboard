"use client";

import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import type { Politician, PoliticianTrade } from "@/lib/types";
import { TickerBadge } from "@/components/market/TickerBadge";
import { Badge } from "@/components/ui/badge";
import { bucketLabel, partyVariant } from "@/lib/utils/politician";
import { cn } from "@/lib/utils";

export type PoliticianTradeCardVariant = "row" | "card";

export interface PoliticianTradeCardProps {
  trade: PoliticianTrade;
  politician?: Politician;
  variant?: PoliticianTradeCardVariant;
  className?: string;
}

export function PoliticianTradeCard({
  trade,
  politician,
  variant = "card",
  className,
}: PoliticianTradeCardProps) {
  if (variant === "row") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border-muted px-3 py-2 text-xs row-hover",
          className,
        )}
      >
        <Badge variant={trade.side === "buy" ? "gain" : "loss"}>{trade.side}</Badge>
        <TickerBadge symbol={trade.symbol} size="sm" />
        {politician ? (
          <Link
            href={`/politicians/${politician.id}`}
            className="truncate text-text hover:text-accent"
          >
            {politician.name}
          </Link>
        ) : (
          <span className="text-text-muted">Unknown</span>
        )}
        {politician ? (
          <Badge variant={partyVariant(politician.party)} className="px-1 py-0">
            {politician.party}
          </Badge>
        ) : null}
        <span className="text-text-muted">{politician?.chamber ?? "—"}</span>
        <span className="font-mono text-text-muted">{bucketLabel(trade.amountBucket)}</span>
        <span className="text-text-muted">owner: {trade.owner}</span>
        <span className="ml-auto font-mono text-2xs text-text-subtle">
          traded {formatDistanceToNowStrict(trade.tradeDate, { addSuffix: true })}
        </span>
        <span className="font-mono text-2xs text-text-subtle">lag {trade.lagDays}d</span>
      </div>
    );
  }

  return (
    <article className={cn("panel flex flex-col gap-2 p-3", className)}>
      <header className="flex items-start gap-2">
        {politician ? (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm font-mono text-xs font-semibold",
              politician.party === "D" && "bg-[hsl(var(--dem)/0.15)] text-[hsl(var(--dem))]",
              politician.party === "R" && "bg-[hsl(var(--rep)/0.15)] text-[hsl(var(--rep))]",
              politician.party === "I" && "bg-[hsl(var(--ind)/0.15)] text-[hsl(var(--ind))]",
            )}
            aria-hidden
          >
            {politician.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {politician ? (
              <>
                <Link
                  href={`/politicians/${politician.id}`}
                  className="truncate text-sm font-medium text-text hover:text-accent"
                >
                  {politician.name}
                </Link>
                <Badge variant={partyVariant(politician.party)} className="px-1 py-0">
                  {politician.party}
                </Badge>
                <span className="text-2xs text-text-subtle">
                  · {politician.chamber} · {politician.state}
                  {politician.district ? `-${politician.district}` : ""}
                </span>
              </>
            ) : (
              <span className="text-sm text-text-muted">Unknown politician</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-text-subtle">
            <span>traded {formatDistanceToNowStrict(trade.tradeDate, { addSuffix: true })}</span>
            <span>·</span>
            <span>disclosed {formatDistanceToNowStrict(trade.disclosureDate, { addSuffix: true })}</span>
            <span className="rounded-sm border border-border bg-bg-overlay px-1 font-mono">
              lag {trade.lagDays}d
            </span>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 border-t border-border-muted pt-2">
        <Badge variant={trade.side === "buy" ? "gain" : "loss"}>{trade.side.toUpperCase()}</Badge>
        <TickerBadge symbol={trade.symbol} size="sm" />
        <span className="font-mono text-xs text-text">{bucketLabel(trade.amountBucket)}</span>
        <span className="text-2xs uppercase text-text-subtle">{trade.assetType}</span>
        <span className="ml-auto text-2xs uppercase text-text-subtle">owner: {trade.owner}</span>
      </div>
    </article>
  );
}
