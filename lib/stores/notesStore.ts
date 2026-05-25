"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";
import type { UserNote } from "@/lib/types";

interface NotesState {
  hydrated: boolean;
  items: UserNote[];
  bootstrap: () => Promise<void>;
  upsert: (input: { id?: string; symbol?: string; body: string }) => UserNote;
  remove: (id: string) => void;
}

function persist(items: UserNote[]): void {
  void savePersisted(KEYS.notes, items);
}

export const useNotesStore = create<NotesState>((set, get) => ({
  hydrated: false,
  items: [],
  bootstrap: async () => {
    const items = await loadPersisted<UserNote[]>(KEYS.notes, []);
    set({ hydrated: true, items });
  },
  upsert: ({ id, symbol, body }) => {
    const now = Date.now();
    if (id) {
      const next = get().items.map((n) =>
        n.id === id ? { ...n, body, updatedAt: now } : n,
      );
      set({ items: next });
      persist(next);
      return next.find((n) => n.id === id)!;
    }
    const note: UserNote = {
      id: `note_${crypto.randomUUID().slice(0, 8)}`,
      symbol,
      body,
      createdAt: now,
      updatedAt: now,
    };
    const next = [note, ...get().items];
    set({ items: next });
    persist(next);
    return note;
  },
  remove: (id) => {
    const next = get().items.filter((n) => n.id !== id);
    set({ items: next });
    persist(next);
  },
}));
