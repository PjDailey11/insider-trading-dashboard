"use client";

import { create } from "zustand";
import { KEYS, loadPersisted, savePersisted } from "@/lib/persistence/idb";
import type { PanelLayout } from "@/lib/types";

interface ShellLayout {
  leftRailCollapsed: boolean;
  rightRailVisible: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: "alerts" | "news" | "politicians";
}

interface LayoutState {
  hydrated: boolean;
  shell: ShellLayout;
  savedLayouts: PanelLayout[];
  activeLayoutId: string | null;
  bootstrap: () => Promise<void>;
  toggleLeftRail: () => void;
  toggleRightRail: () => void;
  toggleBottomPanel: (open?: boolean) => void;
  setBottomTab: (tab: ShellLayout["bottomPanelTab"]) => void;
  saveLayout: (name: string, layout: unknown) => PanelLayout;
  loadLayout: (id: string) => PanelLayout | null;
  deleteLayout: (id: string) => void;
  exportLayouts: () => string;
  importLayouts: (json: string) => void;
}

const DEFAULT_SHELL: ShellLayout = {
  leftRailCollapsed: false,
  rightRailVisible: true,
  bottomPanelOpen: false,
  bottomPanelTab: "alerts",
};

const PRESET_LAYOUTS: PanelLayout[] = [
  {
    id: "preset_open",
    name: "Open",
    layout: { id: "open", panes: ["chart", "watchlist", "news"] },
    createdAt: Date.now(),
  },
  {
    id: "preset_earnings",
    name: "Earnings Day",
    layout: { id: "earnings", panes: ["chart", "news", "alerts", "calendar"] },
    createdAt: Date.now(),
  },
  {
    id: "preset_macro",
    name: "Macro",
    layout: { id: "macro", panes: ["heatmap", "macro-strip", "politicians"] },
    createdAt: Date.now(),
  },
];

function persistShell(shell: ShellLayout): void {
  void savePersisted(KEYS.layoutActive, shell);
}

function persistLayouts(layouts: PanelLayout[]): void {
  void savePersisted(KEYS.layouts, layouts);
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  hydrated: false,
  shell: DEFAULT_SHELL,
  savedLayouts: PRESET_LAYOUTS,
  activeLayoutId: null,

  bootstrap: async () => {
    const [shell, layouts] = await Promise.all([
      loadPersisted<ShellLayout>(KEYS.layoutActive, DEFAULT_SHELL),
      loadPersisted<PanelLayout[]>(KEYS.layouts, PRESET_LAYOUTS),
    ]);
    set({ hydrated: true, shell, savedLayouts: layouts });
  },

  toggleLeftRail: () => {
    const shell = { ...get().shell, leftRailCollapsed: !get().shell.leftRailCollapsed };
    set({ shell });
    persistShell(shell);
  },
  toggleRightRail: () => {
    const shell = { ...get().shell, rightRailVisible: !get().shell.rightRailVisible };
    set({ shell });
    persistShell(shell);
  },
  toggleBottomPanel: (open) => {
    const next = open === undefined ? !get().shell.bottomPanelOpen : open;
    const shell = { ...get().shell, bottomPanelOpen: next };
    set({ shell });
    persistShell(shell);
  },
  setBottomTab: (tab) => {
    const shell = { ...get().shell, bottomPanelTab: tab, bottomPanelOpen: true };
    set({ shell });
    persistShell(shell);
  },

  saveLayout: (name, layout) => {
    const item: PanelLayout = {
      id: `layout_${crypto.randomUUID().slice(0, 8)}`,
      name,
      layout,
      createdAt: Date.now(),
    };
    const next = [...get().savedLayouts, item];
    set({ savedLayouts: next, activeLayoutId: item.id });
    persistLayouts(next);
    return item;
  },
  loadLayout: (id) => {
    const found = get().savedLayouts.find((l) => l.id === id) ?? null;
    if (found) set({ activeLayoutId: id });
    return found;
  },
  deleteLayout: (id) => {
    const next = get().savedLayouts.filter((l) => l.id !== id);
    const active = get().activeLayoutId === id ? null : get().activeLayoutId;
    set({ savedLayouts: next, activeLayoutId: active });
    persistLayouts(next);
  },
  exportLayouts: () => {
    return JSON.stringify(get().savedLayouts, null, 2);
  },
  importLayouts: (json) => {
    try {
      const parsed = JSON.parse(json) as PanelLayout[];
      if (!Array.isArray(parsed)) throw new Error("Expected array");
      set({ savedLayouts: parsed });
      persistLayouts(parsed);
    } catch (err) {
      console.error("Failed to import layouts", err);
      throw err;
    }
  },
}));
