"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";
import type { SavedScreen, ScreenerCriterion } from "@/lib/types";

interface ScreenerState {
  hydrated: boolean;
  saved: SavedScreen[];
  draft: ScreenerCriterion[];
  bootstrap: () => Promise<void>;
  setDraft: (criteria: ScreenerCriterion[]) => void;
  saveScreen: (name: string) => SavedScreen;
  loadScreen: (id: string) => void;
  deleteScreen: (id: string) => void;
}

function persist(items: SavedScreen[]): void {
  void savePersisted(KEYS.screens, items);
}

export const useScreenerStore = create<ScreenerState>((set, get) => ({
  hydrated: false,
  saved: [],
  draft: [],
  bootstrap: async () => {
    const saved = await loadPersisted<SavedScreen[]>(KEYS.screens, []);
    set({ hydrated: true, saved });
  },
  setDraft: (criteria) => set({ draft: criteria }),
  saveScreen: (name) => {
    const screen: SavedScreen = {
      id: `screen_${crypto.randomUUID().slice(0, 8)}`,
      name,
      criteria: get().draft,
      createdAt: Date.now(),
    };
    const next = [...get().saved, screen];
    set({ saved: next });
    persist(next);
    return screen;
  },
  loadScreen: (id) => {
    const screen = get().saved.find((s) => s.id === id);
    if (screen) set({ draft: screen.criteria });
  },
  deleteScreen: (id) => {
    const next = get().saved.filter((s) => s.id !== id);
    set({ saved: next });
    persist(next);
  },
}));
