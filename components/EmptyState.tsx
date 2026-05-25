import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-8 text-center",
        className,
      )}
    >
      {icon ? <div className="text-text-subtle">{icon}</div> : null}
      <h3 className="text-sm font-medium text-text">{title}</h3>
      {description ? (
        <p className="max-w-sm text-xs text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
