"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Newspaper, Bell, Users } from "lucide-react";
import { useState } from "react";
import { useNews } from "@/lib/hooks/useNews";
import { usePoliticianTrades } from "@/lib/hooks/usePoliticianTrades";
import { useAlertsStore } from "@/lib/stores/alertsStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { partyVariant } from "@/lib/utils/politician";
import { usePoliticians } from "@/lib/hooks/usePoliticians";

export function RightRail() {
  return (
    <aside className="hidden h-full w-right shrink-0 flex-col overflow-hidden border-l border-border bg-bg lg:flex">
      <NewsSection />
      <PoliticianFeedSection />
      <AlertsSection />
    </aside>
  );
}

function Section({
  title,
  icon: Icon,
  href,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: typeof Newspaper;
  href?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex min-h-0 flex-1 flex-col border-b border-border last:border-b-0">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-border bg-bg-raised px-2.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-text-muted hover:text-text"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Icon className="h-3 w-3" />
          <span className="text-2xs font-medium uppercase tracking-wider">{title}</span>
        </button>
        {href ? (
          <Link
            href={href}
            className="ml-auto text-2xs uppercase tracking-wider text-text-subtle hover:text-text"
          >
            View all
          </Link>
        ) : null}
      </div>
      {open ? <div className="min-h-0 flex-1 overflow-auto">{children}</div> : null}
    </div>
  );
}

function NewsSection() {
  const { data, isLoading } = useNews({ limit: 8 });
  return (
    <Section title="News" icon={Newspaper} href="/">
      {isLoading ? (
        <div className="flex flex-col gap-1 p-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {(data?.items ?? []).map((n) => (
            <li
              key={n.id}
              className="border-b border-border-muted last:border-b-0 px-2.5 py-2 row-hover"
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={
                    n.sentiment === "bullish"
                      ? "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gain"
                      : n.sentiment === "bearish"
                        ? "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-loss"
                        : "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-subtle"
                  }
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs text-text">{n.headline}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-2xs text-text-subtle">
                    <span>{n.source}</span>
                    <span>·</span>
                    <span>{formatDistanceToNowStrict(n.publishedAt, { addSuffix: true })}</span>
                    {n.symbols.length > 0 ? (
                      <span className="font-mono">· {n.symbols.slice(0, 2).join(" ")}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function PoliticianFeedSection() {
  const { data, isLoading } = usePoliticianTrades({ limit: 8 });
  const { data: politicians } = usePoliticians();
  const polById = new Map((politicians ?? []).map((p) => [p.id, p]));
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Section title="Politician feed" icon={Users} href="/politicians">
      {isLoading ? (
        <div className="flex flex-col gap-1 p-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {items.map((t) => {
            const p = polById.get(t.politicianId);
            return (
              <li
                key={t.id}
                className="border-b border-border-muted last:border-b-0 px-2.5 py-2 row-hover"
              >
                <div className="flex items-center gap-1.5">
                  <Badge variant={p ? partyVariant(p.party) : "muted"} className="px-1 py-0">
                    {p?.party ?? "?"}
                  </Badge>
                  <span className="font-mono text-xs font-medium text-text">{t.symbol}</span>
                  <Badge variant={t.side === "buy" ? "gain" : "loss"} className="px-1 py-0">
                    {t.side}
                  </Badge>
                  <span className="ml-auto text-2xs text-text-subtle">{t.amountBucket}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-2xs text-text-muted">
                  <span className="truncate">{p?.name ?? "Unknown"}</span>
                  <span>·</span>
                  <span>lag {t.lagDays}d</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function AlertsSection() {
  const items = useAlertsStore((s) => s.items);
  const active = items.filter((a) => a.status === "active");
  return (
    <Section title="Alerts" icon={Bell} href="/alerts">
      {active.length === 0 ? (
        <div className="p-4 text-2xs text-text-subtle">No active alerts.</div>
      ) : (
        <ul className="flex flex-col">
          {active.slice(0, 6).map((a) => (
            <li
              key={a.id}
              className="border-b border-border-muted last:border-b-0 px-2.5 py-2 row-hover"
            >
              <div className="flex items-center gap-1.5">
                <Bell className="h-3 w-3 text-warn" />
                <span className="truncate text-xs text-text">{a.name}</span>
              </div>
              <div className="mt-1 text-2xs text-text-subtle">
                {a.trigger.kind}
                {a.events[0] ? ` · last: ${formatDistanceToNowStrict(a.events[0].ts, { addSuffix: true })}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
