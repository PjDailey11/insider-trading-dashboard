"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";
import type { Position } from "@/lib/types";

import positionsSeed from "@/seed/positions.json";

interface PositionsState {
  hydrated: boolean;
  items: Position[];
  bootstrap: () => Promise<void>;
  add: (input: Omit<Position, "id" | "openedAt"> & { openedAt?: number }) => Position;
  update: (id: string, patch: Partial<Pick<Position, "quantity" | "avgCost" | "note" | "closedAt">>) => void;
  remove: (id: string) => void;
}

const SEED = positionsSeed as Position[];

function persist(items: Position[]): void {
  void savePersisted(KEYS.positions, items);
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  hydrated: false,
  items: SEED,
  bootstrap: async () => {
    const items = await loadPersisted<Position[]>(KEYS.positions, SEED);
    set({ hydrated: true, items });
  },
  add: (input) => {
    const pos: Position = {
      id: `pos_${crypto.randomUUID().slice(0, 8)}`,
      openedAt: input.openedAt ?? Date.now(),
      ...input,
    };
    const next = [...get().items, pos];
    set({ items: next });
    persist(next);
    return pos;
  },
  update: (id, patch) => {
    const next = get().items.map((p) => (p.id === id ? { ...p, ...patch } : p));
    set({ items: next });
    persist(next);
  },
  remove: (id) => {
    const next = get().items.filter((p) => p.id !== id);
    set({ items: next });
    persist(next);
  },
}));
