"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tinykeys } from "tinykeys";
import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import { useLayoutStore } from "@/lib/stores/layoutStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Shortcut {
  combo: string;
  label: string;
  action: () => void;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const toggleCommand = useCommandPalette((s) => s.toggle);
  const toggleBottom = useLayoutStore((s) => s.toggleBottomPanel);
  const toggleLeft = useLayoutStore((s) => s.toggleLeftRail);
  const toggleRight = useLayoutStore((s) => s.toggleRightRail);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const shortcuts: Record<string, (e: KeyboardEvent) => void> = {
      "$mod+KeyK": (e) => {
        e.preventDefault();
        toggleCommand();
      },
      "Slash": (e) => {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        e.preventDefault();
        toggleCommand();
      },
      "Shift+Slash": (e) => {
        e.preventDefault();
        setHelpOpen(true);
      },
      "g h": () => router.push("/"),
      "g w": () => router.push("/watchlists"),
      "g a": () => router.push("/alerts"),
      "g p": () => router.push("/portfolio"),
      "g i": () => router.push("/politicians"),
      "g s": () => router.push("/screener"),
      "g ,": () => router.push("/settings"),
      "$mod+KeyB": (e) => {
        e.preventDefault();
        toggleLeft();
      },
      "$mod+Backslash": (e) => {
        e.preventDefault();
        toggleRight();
      },
      "$mod+KeyJ": (e) => {
        e.preventDefault();
        toggleBottom();
      },
    };
    return tinykeys(window, shortcuts);
  }, [router, toggleCommand, toggleBottom, toggleLeft, toggleRight]);

  const display: Shortcut[] = [
    { combo: "⌘ K", label: "Open command palette", action: toggleCommand },
    { combo: "/", label: "Quick search", action: toggleCommand },
    { combo: "G H", label: "Go to Dashboard", action: () => router.push("/") },
    { combo: "G W", label: "Go to Watchlists", action: () => router.push("/watchlists") },
    { combo: "G A", label: "Go to Alerts", action: () => router.push("/alerts") },
    { combo: "G P", label: "Go to Portfolio", action: () => router.push("/portfolio") },
    { combo: "G I", label: "Go to Politicians", action: () => router.push("/politicians") },
    { combo: "G S", label: "Go to Screener", action: () => router.push("/screener") },
    { combo: "⌘ B", label: "Toggle left rail", action: toggleLeft },
    { combo: "⌘ \\", label: "Toggle right rail", action: toggleRight },
    { combo: "⌘ J", label: "Toggle bottom panel", action: toggleBottom },
    { combo: "?", label: "Show this help", action: () => setHelpOpen(true) },
  ];

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Press ? anywhere to open this sheet.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {display.map((s) => (
            <div
              key={s.combo}
              className="flex items-center justify-between gap-3 rounded border border-border-muted bg-bg-sunken px-2.5 py-1.5"
            >
              <span className="text-xs text-text">{s.label}</span>
              <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-2xs text-text-muted">
                {s.combo}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
