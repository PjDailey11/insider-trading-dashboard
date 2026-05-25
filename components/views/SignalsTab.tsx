"use client";

import { useMemo } from "react";
import { usePoliticianTradesForSymbol } from "@/lib/hooks/usePoliticianTrades";
import { usePoliticians } from "@/lib/hooks/usePoliticians";
import { useQuote } from "@/lib/hooks/useQuotes";
import { useNews } from "@/lib/hooks/useNews";
import { EmptyState } from "@/components/EmptyState";
import { Activity, Newspaper, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import type { SignalEvent } from "@/lib/types";
import { bucketImportance, bucketLabel } from "@/lib/utils/politician";

export interface SignalsTabProps {
  symbol: string;
}

export function SignalsTab({ symbol }: SignalsTabProps) {
  const { data: trades } = usePoliticianTradesForSymbol(symbol, { limit: 50 });
  const { data: politicians } = usePoliticians();
  const { data: news } = useNews({ symbols: [symbol], limit: 20 });
  const { data: quote } = useQuote(symbol);

  const polById = useMemo(
    () => new Map((politicians ?? []).map((p) => [p.id, p])),
    [politicians],
  );

  const signals = useMemo<SignalEvent[]>(() => {
    const out: SignalEvent[] = [];
    for (const t of trades ?? []) {
      const pol = polById.get(t.politicianId);
      out.push({
        id: `sig-${t.id}`,
        symbol,
        kind: t.side === "buy" ? "politicianBuy" : "politicianSell",
        ts: t.tradeDate,
        importance: bucketImportance(t.amountBucket),
        title: `${pol?.name ?? "Unknown"} (${pol?.party ?? "?"}) ${t.side} ${bucketLabel(t.amountBucket)}`,
        detail: `owner: ${t.owner} · disclosed lag ${t.lagDays}d`,
      });
    }
    const recentNews = (news?.items ?? []).slice(0, 6);
    if (recentNews.length >= 3) {
      out.push({
        id: "sig-newsburst",
        symbol,
        kind: "newsBurst",
        ts: recentNews[0]!.publishedAt,
        importance: 2,
        title: `News burst: ${recentNews.length} stories in last week`,
        detail: recentNews
          .slice(0, 3)
          .map((n) => n.headline)
          .join(" · "),
      });
    }
    if (quote && quote.volume > quote.avgVolume * 1.8) {
      out.push({
        id: "sig-volume",
        symbol,
        kind: "volumeSpike",
        ts: quote.ts,
        importance: 3,
        title: `Volume spike: ${(quote.volume / quote.avgVolume).toFixed(1)}× avg`,
      });
    }
    return out.sort((a, b) => b.ts - a.ts);
  }, [trades, polById, news, quote, symbol]);

  if (signals.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-5 w-5" />}
        title="No recent signals"
        description="When politicians trade, news clusters, or volume spikes — they will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col">
      {signals.map((s) => (
        <div
          key={s.id}
          className="flex items-start gap-2.5 border-b border-border-muted px-3 py-2 row-hover"
        >
          <SignalIcon kind={s.kind} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text">{s.title}</span>
              <Badge variant={importanceVariant(s.importance)} className="px-1 py-0">
                ★ {s.importance}
              </Badge>
            </div>
            {s.detail ? (
              <p className="mt-0.5 text-2xs text-text-muted">{s.detail}</p>
            ) : null}
          </div>
          <span className="ml-auto whitespace-nowrap font-mono text-2xs text-text-subtle">
            {formatDistanceToNowStrict(s.ts, { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}

function SignalIcon({ kind }: { kind: SignalEvent["kind"] }) {
  const cls = "h-3.5 w-3.5";
  if (kind === "politicianBuy")
    return <Users className={`${cls} text-gain`} />;
  if (kind === "politicianSell")
    return <Users className={`${cls} text-loss`} />;
  if (kind === "newsBurst") return <Newspaper className={`${cls} text-info`} />;
  if (kind === "volumeSpike") return <TrendingUp className={`${cls} text-warn`} />;
  if (kind === "rsiOverbought") return <TrendingDown className={`${cls} text-loss`} />;
  return <Activity className={cls} />;
}

function importanceVariant(importance: number): "gain" | "warn" | "muted" | "accent" {
  if (importance >= 4) return "warn";
  if (importance >= 3) return "accent";
  return "muted";
}
