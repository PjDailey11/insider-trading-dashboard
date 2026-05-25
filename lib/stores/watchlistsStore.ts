"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";
import type { Watchlist } from "@/lib/types";

import watchlistsSeed from "@/seed/watchlists.json";

interface WatchlistsState {
  hydrated: boolean;
  items: Watchlist[];
  activeId: string | null;
  bootstrap: () => Promise<void>;
  create: (name: string, symbols?: string[]) => Watchlist;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  addSymbol: (id: string, symbol: string) => void;
  removeSymbol: (id: string, symbol: string) => void;
  reorderSymbols: (id: string, symbols: string[]) => void;
  setActive: (id: string | null) => void;
}

const SEED = watchlistsSeed as Watchlist[];

function persist(items: Watchlist[]): void {
  void savePersisted(KEYS.watchlists, items);
}

export const useWatchlistsStore = create<WatchlistsState>((set, get) => ({
  hydrated: false,
  items: SEED,
  activeId: SEED[0]?.id ?? null,

  bootstrap: async () => {
    const items = await loadPersisted<Watchlist[]>(KEYS.watchlists, SEED);
    set({
      hydrated: true,
      items,
      activeId: get().activeId ?? items[0]?.id ?? null,
    });
  },

  create: (name, symbols = []) => {
    const wl: Watchlist = {
      id: `wl_${crypto.randomUUID().slice(0, 8)}`,
      name,
      symbols,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [...get().items, wl];
    set({ items: next, activeId: wl.id });
    persist(next);
    return wl;
  },

  rename: (id, name) => {
    const next = get().items.map((w) =>
      w.id === id ? { ...w, name, updatedAt: Date.now() } : w,
    );
    set({ items: next });
    persist(next);
  },

  remove: (id) => {
    const next = get().items.filter((w) => w.id !== id);
    const activeId = get().activeId === id ? (next[0]?.id ?? null) : get().activeId;
    set({ items: next, activeId });
    persist(next);
  },

  addSymbol: (id, symbol) => {
    const next = get().items.map((w) => {
      if (w.id !== id) return w;
      if (w.symbols.includes(symbol)) return w;
      return { ...w, symbols: [...w.symbols, symbol], updatedAt: Date.now() };
    });
    set({ items: next });
    persist(next);
  },

  removeSymbol: (id, symbol) => {
    const next = get().items.map((w) =>
      w.id === id
        ? { ...w, symbols: w.symbols.filter((s) => s !== symbol), updatedAt: Date.now() }
        : w,
    );
    set({ items: next });
    persist(next);
  },

  reorderSymbols: (id, symbols) => {
    const next = get().items.map((w) =>
      w.id === id ? { ...w, symbols, updatedAt: Date.now() } : w,
    );
    set({ items: next });
    persist(next);
  },

  setActive: (id) => set({ activeId: id }),
}));
