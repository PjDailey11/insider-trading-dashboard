"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PanelProps {
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  density?: "comfortable" | "compact";
}

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
  density = "comfortable",
}: PanelProps) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {title || actions ? (
        <header className="panel-header">
          <div className="flex items-center gap-2 truncate">{title}</div>
          {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
        </header>
      ) : null}
      <div
        className={cn(
          "min-h-0 flex-1",
          density === "comfortable" ? "p-3" : "p-1",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
