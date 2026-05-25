"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ListChecks, PieChart, Search, Filter, Users, Settings, LayoutDashboard, TrendingUp } from "lucide-react";
import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTickerSearch } from "@/lib/hooks/useTickers";
import { usePoliticians } from "@/lib/hooks/usePoliticians";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";

export function CommandPalette() {
  const isOpen = useCommandPalette((s) => s.isOpen);
  const close = useCommandPalette((s) => s.close);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) setQuery("");
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const { data: tickers = [] } = useTickerSearch(query, 8);
  const { data: politicians = [] } = usePoliticians();
  const watchlists = useWatchlistsStore((s) => s.items);

  const filteredPoliticians = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return politicians.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [politicians, query]);

  const go = (href: string) => {
    router.push(href);
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <DialogContent className="max-w-xl p-0 gap-0 bg-bg-overlay border-border">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search symbols, politicians, watchlists, or jump to…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>

            {tickers.length > 0 ? (
              <CommandGroup heading="Symbols">
                {tickers.map((t) => (
                  <CommandItem
                    key={t.symbol}
                    value={`symbol-${t.symbol}`}
                    onSelect={() => go(`/s/${t.symbol}`)}
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-text-subtle" />
                    <span className="font-mono font-medium">{t.symbol}</span>
                    <span className="truncate text-text-muted">{t.name}</span>
                    <CommandShortcut>{t.exchange}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {filteredPoliticians.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Politicians">
                  {filteredPoliticians.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`politician-${p.id}`}
                      onSelect={() => go(`/politicians/${p.id}`)}
                    >
                      <Users className="h-3.5 w-3.5 text-text-subtle" />
                      <span>{p.name}</span>
                      <span className="text-text-subtle">
                        {p.chamber} · {p.party} · {p.state}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {watchlists.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Watchlists">
                  {watchlists.map((w) => (
                    <CommandItem
                      key={w.id}
                      value={`watchlist-${w.id}`}
                      onSelect={() => go(`/watchlists/${w.id}`)}
                    >
                      <ListChecks className="h-3.5 w-3.5 text-text-subtle" />
                      <span>{w.name}</span>
                      <CommandShortcut>{w.symbols.length}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            <CommandSeparator />
            <CommandGroup heading="Pages">
              <CommandItem value="page-dashboard" onSelect={() => go("/")}>
                <LayoutDashboard className="h-3.5 w-3.5 text-text-subtle" />
                Dashboard
                <CommandShortcut>G H</CommandShortcut>
              </CommandItem>
              <CommandItem value="page-watchlists" onSelect={() => go("/watchlists")}>
                <ListChecks className="h-3.5 w-3.5 text-text-subtle" />
                Watchlists
                <CommandShortcut>G W</CommandShortcut>
              </CommandItem>
              <CommandItem value="page-alerts" onSelect={() => go("/alerts")}>
                <Bell className="h-3.5 w-3.5 text-text-subtle" />
                Alerts
                <CommandShortcut>G A</CommandShortcut>
              </CommandItem>
              <CommandItem value="page-portfolio" onSelect={() => go("/portfolio")}>
                <PieChart className="h-3.5 w-3.5 text-text-subtle" />
                Portfolio
                <CommandShortcut>G P</CommandShortcut>
              </CommandItem>
              <CommandItem value="page-politicians" onSelect={() => go("/politicians")}>
                <Users className="h-3.5 w-3.5 text-text-subtle" />
                Politicians
                <CommandShortcut>G I</CommandShortcut>
              </CommandItem>
              <CommandItem value="page-screener" onSelect={() => go("/screener")}>
                <Filter className="h-3.5 w-3.5 text-text-subtle" />
                Screener
                <CommandShortcut>G S</CommandShortcut>
              </CommandItem>
              <CommandItem value="page-settings" onSelect={() => go("/settings")}>
                <Settings className="h-3.5 w-3.5 text-text-subtle" />
                Settings
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-2xs text-text-subtle">
            <Search className="h-3 w-3" />
            <span>Type to search</span>
            <span className="ml-auto font-mono">
              <kbd className="rounded border border-border px-1">↵</kbd> open ·{" "}
              <kbd className="rounded border border-border px-1">esc</kbd> close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
