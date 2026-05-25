"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInView } from "@/lib/hooks/useInView";
import { usePoliticianTrades } from "@/lib/hooks/usePoliticianTrades";
import { usePoliticians } from "@/lib/hooks/usePoliticians";
import { Panel } from "@/components/Panel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PoliticianTradeCard } from "@/components/politicians/PoliticianTradeCard";
import { EmptyState } from "@/components/EmptyState";
import type {
  AmountBucket,
  Chamber,
  Party,
  TradeOwner,
  TradeSide,
} from "@/lib/types";
import type { PoliticianTradeFilter } from "@/lib/adapters";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { bucketLabel } from "@/lib/utils/politician";
import { isLive } from "@/lib/config/dataSource";

const PARTY_OPTIONS: Party[] = ["D", "R", "I"];
const CHAMBER_OPTIONS: Chamber[] = ["House", "Senate"];
const OWNER_OPTIONS: TradeOwner[] = ["self", "spouse", "joint", "child", "dependent"];
const SIDE_OPTIONS: TradeSide[] = ["buy", "sell"];
const ROLE_OPTIONS = ["Director", "Officer", "10% Owner"] as const;

const AMOUNT_OPTIONS: AmountBucket[] = [
  "1k-15k",
  "15k-50k",
  "50k-100k",
  "100k-250k",
  "250k-500k",
  "500k-1m",
  "1m-5m",
  "5m-25m",
  "25m-50m",
  "50m+",
];

export function PoliticiansFeed() {
  const router = useRouter();
  const params = useSearchParams();

  const live = isLive();

  const filter = useMemo<PoliticianTradeFilter>(() => {
    const parties = params.getAll("party") as Party[];
    const chambers = params.getAll("chamber") as Chamber[];
    const owners = params.getAll("owner") as TradeOwner[];
    const sides = params.getAll("side") as TradeSide[];
    const roles = params.getAll("role");
    const symbol = params.get("symbol") ?? undefined;
    const minAmount = (params.get("minAmount") ?? undefined) as
      | AmountBucket
      | undefined;
    return {
      parties: live || parties.length === 0 ? undefined : parties,
      chambers: live || chambers.length === 0 ? undefined : chambers,
      owners: live || owners.length === 0 ? undefined : owners,
      roles: live && roles.length ? roles : undefined,
      sides: sides.length ? sides : undefined,
      symbol,
      minAmount,
      limit: 24,
    };
  }, [params, live]);

  const setParam = (
    key: string,
    value: string | undefined,
    multi = false,
  ) => {
    const next = new URLSearchParams(params.toString());
    if (multi) {
      const current = next.getAll(key);
      if (value === undefined) next.delete(key);
      else if (current.includes(value)) {
        next.delete(key);
        for (const v of current) if (v !== value) next.append(key, v);
      } else {
        next.append(key, value);
      }
    } else {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/politicians?${next.toString()}`);
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePoliticianTrades(filter);
  const { data: politicians } = usePoliticians();
  const polById = new Map((politicians ?? []).map((p) => [p.id, p]));
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(sentinelRef);
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <main className="grid grid-cols-12 gap-3 p-3">
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-3">
        <Panel
          title={
            <span className="flex items-center gap-1.5 font-medium text-text">
              <Users className="h-3.5 w-3.5 text-text-subtle" />
              {live ? "Insider trades" : "Politician trades"}
              <Badge variant="info" className="ml-1">{items.length}</Badge>
            </span>
          }
          actions={
            <span className="text-2xs text-text-subtle">
              {live
                ? "SEC Form 4 · trade date anchor · lag = filing delay"
                : "anchored to trade date · lag chip = disclosure delay"}
            </span>
          }
          density="compact"
          bodyClassName="p-0"
        >
          {!live ? (
            <>
              <FilterBar
                label="Party"
                values={PARTY_OPTIONS}
                selected={filter.parties ?? []}
                onToggle={(v) => setParam("party", v as string, true)}
              />
              <FilterBar
                label="Chamber"
                values={CHAMBER_OPTIONS}
                selected={filter.chambers ?? []}
                onToggle={(v) => setParam("chamber", v as string, true)}
              />
            </>
          ) : (
            <FilterBar
              label="Role"
              values={[...ROLE_OPTIONS]}
              selected={filter.roles ?? []}
              onToggle={(v) => setParam("role", v as string, true)}
            />
          )}
          <FilterBar
            label="Side"
            values={SIDE_OPTIONS}
            selected={filter.sides ?? []}
            onToggle={(v) => setParam("side", v as string, true)}
          />
          {!live ? (
            <FilterBar
              label="Owner"
              values={OWNER_OPTIONS}
              selected={filter.owners ?? []}
              onToggle={(v) => setParam("owner", v as string, true)}
            />
          ) : null}
          <FilterBar
            label="Min amount"
            values={AMOUNT_OPTIONS}
            selected={filter.minAmount ? [filter.minAmount] : []}
            onToggle={(v) =>
              setParam("minAmount", filter.minAmount === v ? undefined : (v as string))
            }
            renderLabel={(v) => bucketLabel(v as AmountBucket)}
          />

          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No trades match the current filters"
              description="Clear or relax filters to see more results."
            />
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
              <div ref={sentinelRef} className="h-6" />
              {isFetchingNextPage ? (
                <Skeleton className="h-20 w-full" />
              ) : !hasNextPage && items.length > 0 ? (
                <p className="py-2 text-center text-2xs text-text-subtle">
                  End of feed
                </p>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      <div className="col-span-12 lg:col-span-3">
        <PoliticiansShortlist />
      </div>
    </main>
  );
}

function FilterBar<T extends string>({
  label,
  values,
  selected,
  onToggle,
  renderLabel,
}: {
  label: string;
  values: T[];
  selected: T[];
  onToggle: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border-muted px-3 py-1.5">
      <span className="w-16 shrink-0 text-2xs uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => {
          const isOn = selected.includes(v);
          return (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className={cn(
                "rounded-sm border px-1.5 py-0.5 text-2xs uppercase tracking-wider transition-colors",
                isOn
                  ? "border-accent bg-accent-subtle text-accent"
                  : "border-border bg-bg-sunken text-text-muted hover:border-border-strong hover:text-text",
              )}
            >
              {renderLabel ? renderLabel(v) : v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PoliticiansShortlist() {
  const { data: politicians } = usePoliticians();
  const router = useRouter();
  return (
    <Panel
      title={
        <span className="font-medium text-text">
          {isLive() ? "Insiders" : "Politicians"}
        </span>
      }
      density="compact"
      bodyClassName="p-0 max-h-[600px] overflow-auto"
    >
      <ul className="flex flex-col">
        {(politicians ?? []).slice(0, 30).map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 border-b border-border-muted px-3 py-2 text-xs row-hover cursor-pointer"
            onClick={() => router.push(`/politicians/${p.id}`)}
          >
            {isLive() ? (
              <span className="max-w-[72px] truncate text-2xs text-text-subtle">
                {p.committees[0] ?? "Insider"}
              </span>
            ) : (
              <span
                className={cn(
                  "h-5 w-5 shrink-0 rounded-sm font-mono text-2xs flex items-center justify-center font-semibold",
                  p.party === "D" && "bg-[hsl(var(--dem)/0.15)] text-[hsl(var(--dem))]",
                  p.party === "R" && "bg-[hsl(var(--rep)/0.15)] text-[hsl(var(--rep))]",
                  p.party === "I" && "bg-[hsl(var(--ind)/0.15)] text-[hsl(var(--ind))]",
                )}
              >
                {p.party}
              </span>
            )}
            <span className="flex-1 truncate text-text">{p.name}</span>
            <span className="text-2xs text-text-subtle">
              {isLive() ? p.state : `${p.chamber} · ${p.state}`}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
