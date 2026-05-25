"use client";

import Link from "next/link";
import { Panel } from "@/components/Panel";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { SectorHeatmap } from "@/components/market/SectorHeatmap";
import { TopMoversTable } from "@/components/tables/TopMoversTable";
import { NewsCard } from "@/components/news/NewsCard";
import { PoliticianTradeCard } from "@/components/politicians/PoliticianTradeCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNews } from "@/lib/hooks/useNews";
import { usePoliticianTrades } from "@/lib/hooks/usePoliticianTrades";
import { usePoliticians } from "@/lib/hooks/usePoliticians";
import { useAlertsStore } from "@/lib/stores/alertsStore";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Bell, BellOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHome() {
  return (
    <main className="grid grid-cols-12 gap-3 p-3" data-region="dashboard">
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-3">
        <ErrorBoundary region="heatmap">
          <Panel
            title={<span className="font-medium text-text">Sector heatmap</span>}
            density="compact"
            actions={<span className="text-2xs text-text-subtle">market-cap weighted</span>}
          >
            <SectorHeatmap />
          </Panel>
        </ErrorBoundary>

        <ErrorBoundary region="movers">
          <Panel
            title={<span className="font-medium text-text">Movers</span>}
            density="compact"
          >
            <Tabs defaultValue="gainers" className="w-full">
              <TabsList className="border-b border-border">
                <TabsTrigger value="gainers">Top gainers</TabsTrigger>
                <TabsTrigger value="losers">Top losers</TabsTrigger>
                <TabsTrigger value="actives">Most active</TabsTrigger>
              </TabsList>
              <TabsContent value="gainers">
                <TopMoversTable direction="gainers" />
              </TabsContent>
              <TabsContent value="losers">
                <TopMoversTable direction="losers" />
              </TabsContent>
              <TabsContent value="actives">
                <TopMoversTable direction="actives" />
              </TabsContent>
            </Tabs>
          </Panel>
        </ErrorBoundary>
      </div>

      <div className="col-span-12 xl:col-span-4 flex flex-col gap-3">
        <ErrorBoundary region="alerts-summary">
          <AlertsSummary />
        </ErrorBoundary>

        <ErrorBoundary region="news">
          <NewsList />
        </ErrorBoundary>

        <ErrorBoundary region="politicians-teaser">
          <PoliticianFeedTeaser />
        </ErrorBoundary>
      </div>
    </main>
  );
}

function AlertsSummary() {
  const items = useAlertsStore((s) => s.items);
  const active = items.filter((a) => a.status === "active").length;
  const triggered = items.filter((a) => a.status === "triggered").length;
  const snoozed = items.filter((a) => a.status === "snoozed").length;
  const lastEvent = items
    .flatMap((a) => a.events.map((e) => ({ ...e, name: a.name })))
    .sort((a, b) => b.ts - a.ts)[0];

  return (
    <Panel
      title={<span className="font-medium text-text">Alerts</span>}
      actions={
        <Link href="/alerts" className="text-2xs text-text-subtle hover:text-text">
          View all
        </Link>
      }
      density="compact"
      bodyClassName="p-3"
    >
      <div className="grid grid-cols-3 gap-2">
        <SummaryStat label="Active" value={active} icon={<Bell className="h-3 w-3" />} />
        <SummaryStat label="Triggered" value={triggered} variant="warn" />
        <SummaryStat label="Snoozed" value={snoozed} icon={<BellOff className="h-3 w-3" />} muted />
      </div>
      {lastEvent ? (
        <div className="mt-3 rounded border border-border-muted bg-bg-sunken px-2.5 py-1.5 text-2xs">
          <span className="text-text-muted">Last fired: </span>
          <span className="text-text">{lastEvent.message}</span>
        </div>
      ) : null}
    </Panel>
  );
}

function SummaryStat({
  label,
  value,
  icon,
  variant,
  muted,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: "warn";
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded border border-border bg-bg-sunken px-2.5 py-2">
      <span className="flex items-center gap-1 text-2xs uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </span>
      <span
        className={
          variant === "warn"
            ? "font-mono text-xl text-warn tabular"
            : muted
              ? "font-mono text-xl text-text-subtle tabular"
              : "font-mono text-xl text-text tabular"
        }
        data-tabular="true"
      >
        {value}
      </span>
    </div>
  );
}

function NewsList() {
  const { data, isLoading } = useNews({ limit: 8 });
  return (
    <Panel
      title={<span className="font-medium text-text">Top news</span>}
      actions={<span className="text-2xs text-text-subtle">mock feed</span>}
      density="compact"
      bodyClassName="p-0 max-h-[400px] overflow-auto"
    >
      {isLoading ? (
        <div className="flex flex-col gap-1 p-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
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

function PoliticianFeedTeaser() {
  const { data, isLoading } = usePoliticianTrades({ limit: 4 });
  const { data: politicians } = usePoliticians();
  const polById = new Map((politicians ?? []).map((p) => [p.id, p]));
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5 font-medium text-text">
          <Users className="h-3.5 w-3.5 text-text-subtle" />
          Politician feed
          <Badge variant="info" className="ml-1">ambient</Badge>
        </span>
      }
      actions={
        <Link href="/politicians">
          <Button variant="ghost" size="sm">
            View feed <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      }
      density="compact"
      bodyClassName="p-0"
    >
      {isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          {items.map((t) => (
            <PoliticianTradeCard
              key={t.id}
              trade={t}
              politician={polById.get(t.politicianId)}
              variant="card"
            />
          ))}
        </div>
      )}
    </Panel>
  );
}
