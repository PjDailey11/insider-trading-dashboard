"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useTickerSearch } from "@/lib/hooks/useTickers";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AddSymbolFormProps {
  watchlistId: string;
  onAdded?: (symbol: string) => void;
}

export function AddSymbolForm({ watchlistId, onAdded }: AddSymbolFormProps) {
  const [q, setQ] = useState("");
  const { data: results = [] } = useTickerSearch(q, 8);
  const addSymbol = useWatchlistsStore((s) => s.addSymbol);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value.toUpperCase())}
            placeholder="Symbol or company name…"
            className="pl-8"
          />
        </div>
      </div>
      {results.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {results.map((t) => (
            <button
              key={t.symbol}
              onClick={() => {
                addSymbol(watchlistId, t.symbol);
                onAdded?.(t.symbol);
              }}
              className={cn(
                "flex items-center gap-1 rounded-sm border border-border bg-bg-overlay px-2 py-1 text-2xs hover:border-accent/40",
              )}
            >
              <Plus className="h-3 w-3 text-text-subtle" />
              <span className="font-mono font-medium text-text">{t.symbol}</span>
              <span className="text-text-muted">{t.name}</span>
            </button>
          ))}
        </div>
      ) : q ? (
        <span className="text-2xs text-text-subtle">No matches</span>
      ) : null}
    </div>
  );
}
