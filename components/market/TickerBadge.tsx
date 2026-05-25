import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TickerBadgeProps {
  symbol: string;
  className?: string;
  asLink?: boolean;
  size?: "sm" | "md";
}

export function TickerBadge({ symbol, className, asLink = true, size = "md" }: TickerBadgeProps) {
  const inner = (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-bg-overlay font-mono font-medium text-text",
        size === "sm" ? "px-1 py-0 text-2xs" : "px-1.5 py-0.5 text-xs",
        asLink && "hover:border-accent/40 hover:text-accent transition-colors",
        className,
      )}
    >
      {symbol}
    </span>
  );
  if (asLink) {
    return <Link href={`/s/${symbol}`}>{inner}</Link>;
  }
  return inner;
}
