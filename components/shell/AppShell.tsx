"use client";

import type { ReactNode } from "react";
import { Header } from "./Header";
import { MarketStrip } from "./MarketStrip";
import { LeftRail } from "./LeftRail";
import { RightRail } from "./RightRail";
import { BottomPanel } from "./BottomPanel";
import { useLayoutStore } from "@/lib/stores/layoutStore";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const shell = useLayoutStore((s) => s.shell);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-text">
      <Header />
      <MarketStrip />
      <div className="flex min-h-0 flex-1">
        <LeftRail collapsed={shell.leftRailCollapsed} />
        <main
          className={cn(
            "min-w-0 flex-1 flex flex-col bg-bg",
            "border-l border-r border-border",
          )}
        >
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          {shell.bottomPanelOpen ? <BottomPanel /> : null}
        </main>
        {shell.rightRailVisible ? <RightRail /> : null}
      </div>
    </div>
  );
}
