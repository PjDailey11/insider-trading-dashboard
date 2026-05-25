"use client";

import { useEffect } from "react";
import { ChartCard } from "@/components/charts/ChartCard";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Panel } from "@/components/Panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTicker } from "@/lib/hooks/useTickers";
import { useQuote } from "@/lib/hooks/useQuotes";
import { useNews } from "@/lib/hooks/useNews";
import { useSymbolStore } from "@/lib/stores/symbolStore";
import { formatPrice, formatPercent, formatVolume, formatMarketCap } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsCard } from "@/components/news/NewsCard";
import { SignalsTab } from "@/components/views/SignalsTab";
import { NotesPanel } from "@/components/views/NotesPanel";
import { AddToWatchlist } from "@/components/tables/AddToWatchlist";

export interface SymbolWorkspaceProps {
  symbol: string;
}

export function SymbolWorkspace({ symbol }: SymbolWorkspaceProps) {
  const setCurrent = useSymbolStore((s) => s.setCurrent);
  useEffect(() => {
    setCurrent(symbol);
  }, [symbol, setCurrent]);

  return (
    <main className="grid grid-cols-12 gap-3 p-3" data-symbol={symbol}>
      <div className="col-span-12 xl:col-span-9 flex flex-col gap-3">
        <ErrorBoundary region="symbol-header">
          <SymbolHeader symbol={symbol} />
        </ErrorBoundary>
        <ErrorBoundary region="chart">
          <Panel className="h-[520px]" density="compact" bodyClassName="p-0">
            <ChartCard symbol={symbol} />
          </Panel>
        </ErrorBoundary>
        <ErrorBoundary region="tabs">
          <SymbolDetailTabs symbol={symbol} />
        </ErrorBoundary>
      </div>

      <div className="col-span-12 xl:col-span-3 flex flex-col gap-3">
        <ErrorBoundary region="keystats">
          <KeyStatsCard symbol={symbol} />
        </ErrorBoundary>
        <ErrorBoundary region="news">
          <NewsList symbol={symbol} />
        </ErrorBoundary>
      </div>
    </main>
  );
}

function SymbolHeader({ symbol }: { symbol: string }) {
  const { data: ticker } = useTicker(symbol);
  const { data: quote, isLoading } = useQuote(symbol);
  return (
    <Panel density="comfortable" bodyClassName="px-3 py-2.5">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-text">{symbol}</span>
            <span className="text-xs text-text-muted">{ticker?.name ?? "—"}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-2xs text-text-subtle">
            <span>{ticker?.exchange ?? "—"}</span>
            {ticker?.sector ? <span>· {ticker.sector}</span> : null}
            {ticker?.industry ? <span>· {ticker.industry}</span> : null}
          </div>
        </div>
        <div className="flex items-end gap-3">
          {isLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : quote ? (
            <>
              <div className="text-right">
                <div
                  className="font-mono text-2xl font-semibold leading-none tabular text-text"
                  data-tabular="true"
                >
                  {formatPrice(quote.last)}
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-right font-mono text-xs tabular",
                    quote.change > 0 ? "num-up" : quote.change < 0 ? "num-down" : "num-flat",
                  )}
                  data-tabular="true"
                >
                  {quote.change > 0 ? "+" : ""}
                  {quote.change.toFixed(2)} · {formatPercent(quote.changePct)}
                </div>
              </div>
            </>
          ) : (
            <Badge variant="warn">no quote</Badge>
          )}
          <AddToWatchlist symbol={symbol} />
        </div>
      </div>
    </Panel>
  );
}

function KeyStatsCard({ symbol }: { symbol: string }) {
  const { data: ticker } = useTicker(symbol);
  const { data: quote } = useQuote(symbol);

  const stats: Array<[string, string]> = quote
    ? [
        ["Open", formatPrice(quote.open)],
        ["Prev close", formatPrice(quote.prevClose)],
        ["High", formatPrice(quote.high)],
        ["Low", formatPrice(quote.low)],
        ["Volume", formatVolume(quote.volume)],
        ["Avg vol", formatVolume(quote.avgVolume)],
        ["Bid", quote.bid !== undefined ? formatPrice(quote.bid) : "—"],
        ["Ask", quote.ask !== undefined ? formatPrice(quote.ask) : "—"],
        ["Spread", quote.spread !== undefined ? formatPrice(quote.spread, 2) : "—"],
        ["Mkt cap", ticker?.marketCap ? formatMarketCap(ticker.marketCap) : "—"],
      ]
    : [];

  return (
    <Panel
      title={<span className="font-medium text-text">Key stats</span>}
      density="compact"
      bodyClassName="p-0"
    >
      <dl className="grid grid-cols-2 divide-x divide-y divide-border-muted">
        {stats.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 px-2.5 py-2">
            <dt className="text-2xs uppercase tracking-wider text-text-muted">{label}</dt>
            <dd
              className="font-mono text-xs tabular text-text"
              data-tabular="true"
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function NewsList({ symbol }: { symbol: string }) {
  const { data, isLoading } = useNews({ symbols: [symbol], limit: 10 });
  return (
    <Panel
      title={<span className="font-medium text-text">News</span>}
      density="compact"
      bodyClassName="p-0 max-h-[420px] overflow-auto"
    >
      {isLoading ? (
        <div className="flex flex-col gap-1 p-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="p-4 text-2xs text-text-subtle">No recent news.</div>
      ) : (
        <div className="flex flex-col">
          {(data?.items ?? []).map((n) => (
            <NewsCard key={n.id} item={n} compact />
          ))}
        </div>
      )}
    </Panel>
  );
}

function SymbolDetailTabs({ symbol }: { symbol: string }) {
  return (
    <Panel density="compact" bodyClassName="p-0">
      <Tabs defaultValue="signals">
        <TabsList className="border-b border-border px-2">
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="signals">
          <SignalsTab symbol={symbol} />
        </TabsContent>
        <TabsContent value="news">
          <NewsList symbol={symbol} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesPanel symbol={symbol} />
        </TabsContent>
      </Tabs>
    </Panel>
  );
}
