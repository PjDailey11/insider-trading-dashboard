"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  ListChecks,
  Star,
  TrendingUp,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { useSymbolStore } from "@/lib/stores/symbolStore";
import { useRouter } from "next/navigation";

export interface LeftRailProps {
  collapsed: boolean;
}

export function LeftRail({ collapsed }: LeftRailProps) {
  if (collapsed) {
    return (
      <aside className="flex h-full w-railClosed shrink-0 flex-col items-center gap-1.5 border-r border-border bg-bg py-2">
        <Link
          href="/watchlists"
          className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-bg-raised hover:text-text"
          aria-label="Watchlists"
        >
          <ListChecks className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/portfolio"
          className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-bg-raised hover:text-text"
          aria-label="Portfolio"
        >
          <Star className="h-3.5 w-3.5" />
        </Link>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-rail shrink-0 flex-col overflow-hidden border-r border-border bg-bg">
      <WatchlistsSection />
      <RecentSymbolsSection />
      <QuickJumpSection />
    </aside>
  );
}

function WatchlistsSection() {
  const router = useRouter();
  const items = useWatchlistsStore((s) => s.items);
  const create = useWatchlistsStore((s) => s.create);
  const [open, setOpen] = useState(true);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((w) => [w.id, true])),
  );

  return (
    <div className="border-b border-border">
      <div className="flex h-8 items-center gap-1.5 px-2.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-text-muted hover:text-text"
        >
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Watchlists
        </button>
        <button
          onClick={() => {
            const wl = create(`Untitled ${items.length + 1}`, []);
            router.push(`/watchlists/${wl.id}`);
          }}
          className="rounded p-0.5 text-text-subtle hover:bg-bg-raised hover:text-text"
          aria-label="New watchlist"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {open ? (
        <div className="flex flex-col gap-0.5 px-2 pb-2 max-h-[260px] overflow-auto">
          {items.map((wl) => (
            <div key={wl.id}>
              <Link
                href={`/watchlists/${wl.id}`}
                className="group flex h-7 items-center gap-1.5 rounded px-1.5 text-xs text-text-muted hover:bg-bg-raised hover:text-text"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenIds((p) => ({ ...p, [wl.id]: !p[wl.id] }));
                  }}
                  className="text-text-subtle group-hover:text-text"
                >
                  {openIds[wl.id] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <span className="flex-1 truncate">{wl.name}</span>
                <span className="rounded-sm bg-bg-overlay px-1 font-mono text-2xs text-text-subtle">
                  {wl.symbols.length}
                </span>
              </Link>
              {openIds[wl.id] ? (
                <div className="ml-4 flex flex-col gap-0.5 border-l border-border-muted pl-1">
                  {wl.symbols.slice(0, 12).map((s) => (
                    <Link
                      key={`${wl.id}-${s}`}
                      href={`/s/${s}`}
                      className="flex h-6 items-center gap-1.5 rounded px-1.5 font-mono text-xs text-text-subtle hover:bg-bg-raised hover:text-text"
                    >
                      {s}
                    </Link>
                  ))}
                  {wl.symbols.length > 12 ? (
                    <span className="pl-1.5 text-2xs text-text-subtle">
                      +{wl.symbols.length - 12} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RecentSymbolsSection() {
  const history = useSymbolStore((s) => s.history);
  const [open, setOpen] = useState(true);
  if (history.length === 0) return null;
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center gap-1.5 px-2.5 text-2xs font-medium uppercase tracking-wider text-text-muted hover:text-text"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <History className="h-3 w-3" />
        Recent
      </button>
      {open ? (
        <div className="flex flex-col gap-0.5 px-2 pb-2 max-h-[160px] overflow-auto">
          {history.slice(0, 10).map((s) => (
            <Link
              key={`recent-${s}`}
              href={`/s/${s}`}
              className="flex h-6 items-center rounded px-1.5 font-mono text-xs text-text-subtle hover:bg-bg-raised hover:text-text"
            >
              {s}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function QuickJumpSection() {
  const items: Array<{ href: string; label: string }> = [
    { href: "/politicians", label: "Politician feed" },
    { href: "/alerts", label: "Active alerts" },
    { href: "/portfolio", label: "Open positions" },
    { href: "/screener", label: "Screener" },
  ];
  return (
    <div className="mt-auto border-t border-border px-2 py-2">
      <div className="px-1 pb-1.5 text-2xs font-medium uppercase tracking-wider text-text-muted">
        Quick jump
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded px-1.5 text-xs text-text-muted",
              "hover:bg-bg-raised hover:text-text",
            )}
          >
            <TrendingUp className="h-3 w-3 text-text-subtle" />
            {i.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
