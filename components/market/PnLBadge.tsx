import { cn } from "@/lib/utils";
import { formatChange, formatPercent, trendSign } from "@/lib/utils/format";

export interface PnLBadgeProps {
  value: number;
  percent?: number;
  digits?: number;
  size?: "sm" | "md";
  showSign?: boolean;
}

export function PnLBadge({
  value,
  percent,
  digits = 2,
  size = "md",
  showSign = true,
}: PnLBadgeProps) {
  const trend = trendSign(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono tabular tracking-tight",
        size === "sm" ? "text-2xs" : "text-xs",
        trend === "up" && "border-gain/30 bg-gain-subtle text-gain",
        trend === "down" && "border-loss/30 bg-loss-subtle text-loss",
        trend === "flat" && "border-border bg-bg-overlay text-text-muted",
      )}
      data-tabular="true"
    >
      <span>{showSign ? formatChange(value, digits) : value.toFixed(digits)}</span>
      {percent !== undefined ? <span>({formatPercent(percent)})</span> : null}
    </span>
  );
}
