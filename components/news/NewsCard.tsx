"use client";

import { formatDistanceToNowStrict } from "date-fns";
import type { NewsItem } from "@/lib/types";
import { TickerBadge } from "@/components/market/TickerBadge";
import { cn } from "@/lib/utils";

export interface NewsCardProps {
  item: NewsItem;
  compact?: boolean;
  className?: string;
}

export function NewsCard({ item, compact, className }: NewsCardProps) {
  return (
    <article
      className={cn(
        "group flex items-start gap-2 border-b border-border-muted px-3 py-2 row-hover",
        className,
      )}
    >
      <span
        className={cn(
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          item.sentiment === "bullish" && "bg-gain",
          item.sentiment === "bearish" && "bg-loss",
          item.sentiment === "neutral" && "bg-text-subtle",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-text",
            compact ? "line-clamp-2 text-xs" : "text-sm leading-snug",
          )}
        >
          {item.headline}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-text-subtle">
          <span className="font-medium uppercase tracking-wider">{item.source}</span>
          <span>·</span>
          <span>{formatDistanceToNowStrict(item.publishedAt, { addSuffix: true })}</span>
          {item.symbols.length > 0 ? (
            <span className="flex items-center gap-1">
              ·
              {item.symbols.slice(0, 3).map((s) => (
                <TickerBadge key={s} symbol={s} size="sm" />
              ))}
            </span>
          ) : null}
          {item.isGlobal ? (
            <span className="rounded-sm border border-info/30 bg-info-subtle px-1 text-info uppercase">
              global
            </span>
          ) : null}
        </div>
        {!compact && item.summary ? (
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">{item.summary}</p>
        ) : null}
      </div>
    </article>
  );
}
