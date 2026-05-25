"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";

interface PoliticiansFollowState {
  hydrated: boolean;
  followed: string[]; // politician IDs
  bootstrap: () => Promise<void>;
  toggle: (id: string) => void;
  isFollowed: (id: string) => boolean;
}

function persist(items: string[]): void {
  void savePersisted(KEYS.followedPoliticians, items);
}

export const usePoliticiansStore = create<PoliticiansFollowState>((set, get) => ({
  hydrated: false,
  followed: [],
  bootstrap: async () => {
    const followed = await loadPersisted<string[]>(KEYS.followedPoliticians, []);
    set({ hydrated: true, followed });
  },
  toggle: (id) => {
    const has = get().followed.includes(id);
    const next = has ? get().followed.filter((x) => x !== id) : [...get().followed, id];
    set({ followed: next });
    persist(next);
  },
  isFollowed: (id) => get().followed.includes(id),
}));
