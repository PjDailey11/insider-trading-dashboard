"use client";

import { Fragment, type ReactNode } from "react";
import {
  PanelGroup,
  Panel as RPanel,
  PanelResizeHandle,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

export interface SplitPanelChild {
  id: string;
  defaultSize: number;
  minSize?: number;
  content: ReactNode;
}

export interface SplitPanelProps {
  storageId?: string;
  direction?: "horizontal" | "vertical";
  children: SplitPanelChild[];
  className?: string;
}

/**
 * Lightweight resizable split. Persists sizes by id when storageId is set
 * (react-resizable-panels uses sessionStorage internally; we keep IDB-only
 * persistence for app data and let this micro-state stay ephemeral).
 */
export function SplitPanel({
  storageId,
  direction = "horizontal",
  children,
  className,
}: SplitPanelProps) {
  return (
    <PanelGroup
      direction={direction}
      autoSaveId={storageId}
      className={cn("min-h-0", className)}
    >
      {children.map((child, i) => (
        <Fragment key={child.id}>
          <RPanel
            defaultSize={child.defaultSize}
            minSize={child.minSize ?? 12}
            id={child.id}
            order={i}
            className="min-h-0 min-w-0"
          >
            {child.content}
          </RPanel>
          {i < children.length - 1 ? (
            <PanelResizeHandle
              className={
                direction === "horizontal"
                  ? "w-1 bg-bg hover:bg-accent/30 transition-colors"
                  : "h-1 bg-bg hover:bg-accent/30 transition-colors"
              }
            />
          ) : null}
        </Fragment>
      ))}
    </PanelGroup>
  );
}
