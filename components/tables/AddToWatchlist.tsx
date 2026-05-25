"use client";

import { Plus, Check } from "lucide-react";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface AddToWatchlistProps {
  symbol: string;
}

export function AddToWatchlist({ symbol }: AddToWatchlistProps) {
  const items = useWatchlistsStore((s) => s.items);
  const addSymbol = useWatchlistsStore((s) => s.addSymbol);
  const removeSymbol = useWatchlistsStore((s) => s.removeSymbol);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3 w-3" /> Watchlist
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Add {symbol} to…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((w) => {
          const has = w.symbols.includes(symbol);
          return (
            <DropdownMenuItem
              key={w.id}
              onClick={() => (has ? removeSymbol(w.id, symbol) : addSymbol(w.id, symbol))}
            >
              {has ? (
                <Check className="h-3 w-3 text-gain" />
              ) : (
                <Plus className="h-3 w-3 text-text-subtle" />
              )}
              <span className="flex-1">{w.name}</span>
              <span className="text-2xs text-text-subtle">{w.symbols.length}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
