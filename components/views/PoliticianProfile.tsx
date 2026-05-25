"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePolitician } from "@/lib/hooks/usePoliticians";
import { usePoliticianTradesForPolitician } from "@/lib/hooks/usePoliticianTrades";
import { usePoliticiansStore } from "@/lib/stores/politiciansStore";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PoliticianTradeCard } from "@/components/politicians/PoliticianTradeCard";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Star, StarOff, ChevronLeft } from "lucide-react";
import { partyLabel, partyVariant, bucketLabel } from "@/lib/utils/politician";
import { TickerBadge } from "@/components/market/TickerBadge";

export interface PoliticianProfileProps {
  id: string;
}

export function PoliticianProfile({ id }: PoliticianProfileProps) {
  const { data: politician, isLoading } = usePolitician(id);
  const { data: trades } = usePoliticianTradesForPolitician(id);
  const followed = usePoliticiansStore((s) => s.followed.includes(id));
  const toggle = usePoliticiansStore((s) => s.toggle);

  const topTickers = useMemo(() => {
    const counts = new Map<string, { count: number; buys: number; sells: number }>();
    for (const t of trades ?? []) {
      const entry = counts.get(t.symbol) ?? { count: 0, buys: 0, sells: 0 };
      entry.count++;
      if (t.side === "buy") entry.buys++;
      if (t.side === "sell") entry.sells++;
      counts.set(t.symbol, entry);
    }
    return [...counts.entries()]
      .map(([symbol, v]) => ({ symbol, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [trades]);

  const lagHistogram = useMemo(() => {
    const buckets = [
      { range: "0-7d", min: 0, max: 7, count: 0 },
      { range: "8-14d", min: 8, max: 14, count: 0 },
      { range: "15-21d", min: 15, max: 21, count: 0 },
      { range: "22-30d", min: 22, max: 30, count: 0 },
      { range: "31-45d", min: 31, max: 45, count: 0 },
      { range: "46d+", min: 46, max: 9999, count: 0 },
    ];
    for (const t of trades ?? []) {
      const b = buckets.find((x) => t.lagDays >= x.min && t.lagDays <= x.max);
      if (b) b.count++;
    }
    return buckets;
  }, [trades]);

  if (isLoading || !politician) {
    return (
      <main className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12">
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="grid grid-cols-12 gap-3 p-3">
      <div className="col-span-12">
        <Link
          href="/politicians"
          className="mb-2 inline-flex items-center gap-1 text-2xs text-text-subtle hover:text-text"
        >
          <ChevronLeft className="h-3 w-3" /> All politicians
        </Link>
        <div className="panel flex items-start gap-4 p-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded font-mono text-md font-semibold ${
              politician.party === "D"
                ? "bg-[hsl(var(--dem)/0.15)] text-[hsl(var(--dem))]"
                : politician.party === "R"
                  ? "bg-[hsl(var(--rep)/0.15)] text-[hsl(var(--rep))]"
                  : "bg-[hsl(var(--ind)/0.15)] text-[hsl(var(--ind))]"
            }`}
          >
            {politician.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-md font-semibold text-text">{politician.name}</h1>
              <Badge variant={partyVariant(politician.party)}>
                {partyLabel(politician.party)}
              </Badge>
              <Badge variant="muted">{politician.chamber}</Badge>
              <Badge variant="muted">
                {politician.state}
                {politician.district ? `-${politician.district}` : ""}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-2xs text-text-subtle">
              {politician.committees.map((c) => (
                <span
                  key={c}
                  className="rounded-sm border border-border-muted bg-bg-overlay px-1.5 py-0.5"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <Button
            variant={followed ? "default" : "outline"}
            size="sm"
            onClick={() => toggle(id)}
          >
            {followed ? <Star className="h-3 w-3" /> : <StarOff className="h-3 w-3" />}
            {followed ? "Following" : "Follow"}
          </Button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
        <ErrorBoundary region="trades">
          <Panel
            title={<span className="font-medium text-text">Trade history</span>}
            actions={<span className="text-2xs text-text-subtle">{trades?.length ?? 0} trades</span>}
            density="compact"
            bodyClassName="p-0 max-h-[640px] overflow-auto"
          >
            {(trades ?? []).length === 0 ? (
              <p className="p-6 text-center text-2xs text-text-subtle">No disclosed trades.</p>
            ) : (
              (trades ?? []).map((t) => (
                <PoliticianTradeCard
                  key={t.id}
                  trade={t}
                  politician={politician}
                  variant="row"
                />
              ))
            )}
          </Panel>
        </ErrorBoundary>
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
        <ErrorBoundary region="top-tickers">
          <Panel
            title={<span className="font-medium text-text">Top tickers</span>}
            density="compact"
            bodyClassName="p-3 flex flex-col gap-1"
          >
            {topTickers.length === 0 ? (
              <p className="text-2xs text-text-subtle">No tickers traded.</p>
            ) : (
              topTickers.map((t) => (
                <div
                  key={t.symbol}
                  className="flex items-center justify-between rounded border border-border-muted bg-bg-sunken px-2.5 py-1.5"
                >
                  <TickerBadge symbol={t.symbol} size="sm" />
                  <div className="flex items-center gap-2 text-2xs">
                    <span className="text-gain">{t.buys}↑</span>
                    <span className="text-loss">{t.sells}↓</span>
                    <span className="font-mono tabular text-text-muted" data-tabular="true">
                      ×{t.count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </ErrorBoundary>

        <ErrorBoundary region="lag-histogram">
          <Panel
            title={<span className="font-medium text-text">Disclosure lag</span>}
            density="compact"
            bodyClassName="p-3"
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lagHistogram}>
                  <XAxis
                    dataKey="range"
                    stroke="hsl(220 8% 64%)"
                    tick={{ fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
                  />
                  <YAxis
                    stroke="hsl(220 8% 64%)"
                    tick={{ fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
                    width={20}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(220 14% 11%)",
                      border: "1px solid hsl(220 10% 16%)",
                      fontSize: 10,
                    }}
                    cursor={{ fill: "hsl(220 14% 11% / 0.5)" }}
                  />
                  <Bar dataKey="count" fill="hsl(188 78% 48%)" radius={[2, 2, 0, 0]}>
                    {lagHistogram.map((entry, i) => (
                      <Cell key={i} fill={entry.min < 30 ? "hsl(188 78% 48%)" : "hsl(38 92% 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </ErrorBoundary>

        <Panel
          title={<span className="font-medium text-text">Sample bucket</span>}
          density="compact"
          bodyClassName="p-3"
        >
          <p className="text-2xs text-text-muted">
            Bucket sizes follow the official PTR thresholds (e.g. {bucketLabel("50k-100k")},{" "}
            {bucketLabel("1m-5m")}).
          </p>
        </Panel>
      </div>
    </main>
  );
}
