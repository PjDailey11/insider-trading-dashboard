"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";

interface SymbolState {
  hydrated: boolean;
  current: string;
  history: string[]; // most-recent first, capped at 25
  setCurrent: (symbol: string) => void;
  bootstrap: () => Promise<void>;
  clearHistory: () => void;
}

const HISTORY_CAP = 25;

export const useSymbolStore = create<SymbolState>((set, get) => ({
  hydrated: false,
  current: "AAPL",
  history: [],
  bootstrap: async () => {
    const history = await loadPersisted<string[]>(KEYS.symbolHistory, []);
    set({ hydrated: true, history });
  },
  setCurrent: (symbol) => {
    const sym = symbol.toUpperCase();
    const history = [sym, ...get().history.filter((s) => s !== sym)].slice(0, HISTORY_CAP);
    set({ current: sym, history });
    void savePersisted(KEYS.symbolHistory, history);
  },
  clearHistory: () => {
    set({ history: [] });
    void savePersisted(KEYS.symbolHistory, []);
  },
}));
