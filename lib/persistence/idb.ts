"use client";

import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from "idb-keyval";

// ────────────────────────────────────────────────────────────────────────────
// Versioned IndexedDB schema. Bump SCHEMA_VERSION when changing keys' shape.
// Migrations run once on bootstrap; older payloads are converted in place.
// localStorage is deliberately NOT used.
// ────────────────────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 1;

const VERSION_KEY = "__schema_version__";

export const KEYS = {
  watchlists: "watchlists",
  alerts: "alerts",
  positions: "positions",
  notes: "notes",
  layouts: "layouts",
  layoutActive: "layout:active",
  screens: "screens",
  followedPoliticians: "followed:politicians",
  symbolHistory: "history:symbols",
  prefs: "prefs",
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

export interface PersistedEnvelope<T> {
  version: number;
  data: T;
  updatedAt: number;
}

export async function loadPersisted<T>(
  key: StorageKey,
  defaultValue: T,
): Promise<T> {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = await idbGet(key);
    if (!raw) return defaultValue;
    const env = raw as PersistedEnvelope<T>;
    if (typeof env === "object" && env !== null && "data" in env) {
      return env.data ?? defaultValue;
    }
    return (raw as T) ?? defaultValue;
  } catch (err) {
    console.error(`[idb] load failed for ${key}`, err);
    return defaultValue;
  }
}

export async function savePersisted<T>(key: StorageKey, data: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const env: PersistedEnvelope<T> = {
      version: SCHEMA_VERSION,
      data,
      updatedAt: Date.now(),
    };
    await idbSet(key, env);
  } catch (err) {
    console.error(`[idb] save failed for ${key}`, err);
  }
}

export async function clearPersisted(key: StorageKey): Promise<void> {
  if (typeof window === "undefined") return;
  await idbDel(key);
}

export async function clearAll(): Promise<void> {
  if (typeof window === "undefined") return;
  const all = await idbKeys();
  await Promise.all(all.map((k) => idbDel(k)));
}

// ────────────────────────────────────────────────────────────────────────────
// Migration helper. Add cases for each future schema bump.
// ────────────────────────────────────────────────────────────────────────────

type MigrationFn = (current: number) => Promise<void>;

const migrations: MigrationFn[] = [
  async function noop_v1(_current) {
    // v0 → v1: initial. Nothing to migrate.
  },
];

export async function runMigrations(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const stored = (await idbGet(VERSION_KEY)) as number | undefined;
    const from = stored ?? 0;
    for (let v = from; v < SCHEMA_VERSION; v++) {
      const fn = migrations[v];
      if (fn) await fn(v);
    }
    await idbSet(VERSION_KEY, SCHEMA_VERSION);
  } catch (err) {
    console.error("[idb] migration failed", err);
  }
}
