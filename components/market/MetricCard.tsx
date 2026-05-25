import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: "up" | "down" | "flat";
  className?: string;
}

export function MetricCard({ label, value, hint, trend, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "panel flex flex-col gap-1 p-2.5",
        className,
      )}
    >
      <span className="text-2xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-lg leading-none tabular text-text",
          trend === "up" && "text-gain",
          trend === "down" && "text-loss",
        )}
        data-tabular="true"
      >
        {value}
      </span>
      {hint ? <span className="text-2xs text-text-subtle">{hint}</span> : null}
    </div>
  );
}
