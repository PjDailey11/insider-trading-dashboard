"use client";

import { X } from "lucide-react";
import { useLayoutStore } from "@/lib/stores/layoutStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAlertsStore } from "@/lib/stores/alertsStore";
import { useNews } from "@/lib/hooks/useNews";
import { usePoliticianTrades } from "@/lib/hooks/usePoliticianTrades";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";

export function BottomPanel() {
  const tab = useLayoutStore((s) => s.shell.bottomPanelTab);
  const setTab = useLayoutStore((s) => s.setBottomTab);
  const close = useLayoutStore((s) => s.toggleBottomPanel);

  return (
    <div className="flex h-[240px] shrink-0 flex-col border-t border-border bg-bg-raised">
      <div className="flex h-8 shrink-0 items-center border-b border-border">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList className="border-b-0">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="politicians">Politicians</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => close(false)}
          aria-label="Close bottom panel"
          className="mr-1"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "alerts" ? <AlertsTab /> : null}
        {tab === "news" ? <NewsTab /> : null}
        {tab === "politicians" ? <PoliticiansTab /> : null}
      </div>
    </div>
  );
}

function AlertsTab() {
  const items = useAlertsStore((s) => s.items);
  const list = items.filter((a) => a.events.length > 0).slice(0, 30);
  if (list.length === 0)
    return <div className="p-4 text-xs text-text-subtle">No recent alert events.</div>;
  return (
    <ul className="flex flex-col">
      {list.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 border-b border-border-muted px-3 py-2 text-xs row-hover"
        >
          <Badge variant="warn">alert</Badge>
          <span className="flex-1 truncate text-text">{a.events[0]?.message ?? a.name}</span>
          <span className="font-mono text-2xs text-text-subtle">
            {a.events[0] ? formatDistanceToNowStrict(a.events[0].ts, { addSuffix: true }) : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function NewsTab() {
  const { data } = useNews({ limit: 30 });
  if (!data) return <div className="p-4 text-xs text-text-subtle">Loading…</div>;
  return (
    <ul className="flex flex-col">
      {data.items.map((n) => (
        <li
          key={n.id}
          className="flex items-center gap-3 border-b border-border-muted px-3 py-2 text-xs row-hover"
        >
          <span
            className={
              n.sentiment === "bullish"
                ? "h-1.5 w-1.5 rounded-full bg-gain"
                : n.sentiment === "bearish"
                  ? "h-1.5 w-1.5 rounded-full bg-loss"
                  : "h-1.5 w-1.5 rounded-full bg-text-subtle"
            }
            aria-hidden
          />
          <span className="flex-1 truncate text-text">{n.headline}</span>
          <span className="font-mono text-2xs text-text-subtle">{n.source}</span>
          <span className="font-mono text-2xs text-text-subtle">
            {formatDistanceToNowStrict(n.publishedAt, { addSuffix: true })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PoliticiansTab() {
  const { data } = usePoliticianTrades({ limit: 30 });
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <ul className="flex flex-col">
      {items.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-3 border-b border-border-muted px-3 py-2 text-xs row-hover"
        >
          <Badge variant={t.side === "buy" ? "gain" : "loss"}>{t.side}</Badge>
          <span className="font-mono text-text">{t.symbol}</span>
          <span className="flex-1 truncate text-text-muted">
            {t.owner} · {t.amountBucket}
          </span>
          <span className="font-mono text-2xs text-text-subtle">lag {t.lagDays}d</span>
        </li>
      ))}
    </ul>
  );
}
