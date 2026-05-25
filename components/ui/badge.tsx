import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-bg-overlay text-text border border-border",
        outline: "border border-border text-text-muted",
        accent: "bg-accent-subtle text-accent border border-accent/30",
        gain: "bg-gain-subtle text-gain border border-gain/30",
        loss: "bg-loss-subtle text-loss border border-loss/30",
        warn: "bg-warn-subtle text-warn border border-warn/30",
        info: "bg-info-subtle text-info border border-info/30",
        muted: "bg-bg-raised text-text-muted",
        dem: "bg-[hsl(var(--dem)_/_0.15)] text-[hsl(var(--dem))] border border-[hsl(var(--dem)_/_0.3)]",
        rep: "bg-[hsl(var(--rep)_/_0.15)] text-[hsl(var(--rep))] border border-[hsl(var(--rep)_/_0.3)]",
        ind: "bg-[hsl(var(--ind)_/_0.15)] text-[hsl(var(--ind))] border border-[hsl(var(--ind)_/_0.3)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
