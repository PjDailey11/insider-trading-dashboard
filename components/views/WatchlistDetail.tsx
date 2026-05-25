"use client";

import { useState } from "react";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { WatchlistTable } from "@/components/tables/WatchlistTable";
import { Panel } from "@/components/Panel";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { AddSymbolForm } from "@/components/tables/AddSymbolForm";

export interface WatchlistDetailProps {
  id: string;
}

export function WatchlistDetail({ id }: WatchlistDetailProps) {
  const watchlist = useWatchlistsStore((s) => s.items.find((w) => w.id === id));
  const [open, setOpen] = useState(false);

  if (!watchlist) {
    return (
      <main className="p-6 text-xs text-text-muted">Watchlist not found.</main>
    );
  }

  return (
    <main className="flex h-full flex-col gap-3 p-3">
      <Panel
        title={<span className="font-medium text-text">{watchlist.name}</span>}
        actions={
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-2xs text-accent hover:underline"
          >
            {open ? "Cancel" : "+ Add symbol"}
          </button>
        }
        density="compact"
        bodyClassName="p-0 flex-1 flex flex-col"
        className="flex-1 min-h-0"
      >
        {open ? (
          <div className="border-b border-border p-2">
            <AddSymbolForm watchlistId={id} onAdded={() => setOpen(false)} />
          </div>
        ) : null}
        <ErrorBoundary region="watchlist-table">
          <WatchlistTable watchlistId={id} />
        </ErrorBoundary>
      </Panel>
    </main>
  );
}
