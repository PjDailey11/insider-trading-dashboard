"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";
import type { Alert, AlertEvent, AlertStatus, AlertTrigger } from "@/lib/types";

interface AlertsState {
  hydrated: boolean;
  items: Alert[];
  bootstrap: () => Promise<void>;
  create: (input: { name: string; trigger: AlertTrigger; note?: string }) => Alert;
  update: (id: string, patch: Partial<Pick<Alert, "name" | "trigger" | "note">>) => void;
  setStatus: (id: string, status: AlertStatus) => void;
  snooze: (id: string, untilMs: number) => void;
  remove: (id: string) => void;
  fire: (id: string, event: AlertEvent) => void;
}

function defaultSeed(): Alert[] {
  const now = Date.now();
  return [
    {
      id: "alert_seed_1",
      name: "AAPL above $200",
      status: "active",
      createdAt: now - 7 * 86_400_000,
      updatedAt: now - 1 * 86_400_000,
      trigger: { kind: "priceCross", symbol: "AAPL", threshold: 200, direction: "above" },
      events: [],
    },
    {
      id: "alert_seed_2",
      name: "NVDA 3x avg volume",
      status: "active",
      createdAt: now - 14 * 86_400_000,
      updatedAt: now - 4 * 86_400_000,
      trigger: { kind: "volumeSpike", symbol: "NVDA", multiple: 3 },
      events: [],
    },
    {
      id: "alert_seed_3",
      name: "Politician buys in semis (>$50k)",
      status: "active",
      createdAt: now - 30 * 86_400_000,
      updatedAt: now - 2 * 86_400_000,
      trigger: {
        kind: "politicianTrade",
        side: "buy",
        minAmount: "50k-100k",
      },
      events: [
        {
          ts: now - 36 * 3_600_000,
          message: "Rep. Smith reported buy of NVDA ($50k–$100k)",
        },
      ],
    },
  ];
}

function persist(items: Alert[]): void {
  void savePersisted(KEYS.alerts, items);
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  hydrated: false,
  items: defaultSeed(),
  bootstrap: async () => {
    const items = await loadPersisted<Alert[]>(KEYS.alerts, defaultSeed());
    set({ hydrated: true, items });
  },
  create: ({ name, trigger, note }) => {
    const alert: Alert = {
      id: `alert_${crypto.randomUUID().slice(0, 8)}`,
      name,
      status: "active",
      trigger,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      events: [],
      note,
    };
    const next = [alert, ...get().items];
    set({ items: next });
    persist(next);
    return alert;
  },
  update: (id, patch) => {
    const next = get().items.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
    );
    set({ items: next });
    persist(next);
  },
  setStatus: (id, status) => {
    const next = get().items.map((a) =>
      a.id === id ? { ...a, status, updatedAt: Date.now() } : a,
    );
    set({ items: next });
    persist(next);
  },
  snooze: (id, untilMs) => {
    const next = get().items.map((a) =>
      a.id === id
        ? { ...a, status: "snoozed" as AlertStatus, snoozeUntil: untilMs, updatedAt: Date.now() }
        : a,
    );
    set({ items: next });
    persist(next);
  },
  remove: (id) => {
    const next = get().items.filter((a) => a.id !== id);
    set({ items: next });
    persist(next);
  },
  fire: (id, event) => {
    const next = get().items.map((a) => {
      if (a.id !== id) return a;
      const events = [event, ...a.events].slice(0, 50);
      return {
        ...a,
        status: "triggered" as AlertStatus,
        lastTriggeredAt: event.ts,
        events,
        updatedAt: Date.now(),
      };
    });
    set({ items: next });
    persist(next);
  },
}));
