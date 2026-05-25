"use client";

import { runMigrations } from "./idb";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { useAlertsStore } from "@/lib/stores/alertsStore";
import { usePositionsStore } from "@/lib/stores/positionsStore";
import { useNotesStore } from "@/lib/stores/notesStore";
import { useLayoutStore } from "@/lib/stores/layoutStore";
import { useSymbolStore } from "@/lib/stores/symbolStore";
import { usePoliticiansStore } from "@/lib/stores/politiciansStore";
import { useScreenerStore } from "@/lib/stores/screenerStore";

let bootstrapped = false;
let inFlight: Promise<void> | null = null;

export async function bootstrapPersistence(): Promise<void> {
  if (bootstrapped) return;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    await runMigrations();
    await Promise.all([
      useWatchlistsStore.getState().bootstrap(),
      useAlertsStore.getState().bootstrap(),
      usePositionsStore.getState().bootstrap(),
      useNotesStore.getState().bootstrap(),
      useLayoutStore.getState().bootstrap(),
      useSymbolStore.getState().bootstrap(),
      usePoliticiansStore.getState().bootstrap(),
      useScreenerStore.getState().bootstrap(),
    ]);
    bootstrapped = true;
  })();
  return inFlight;
}
