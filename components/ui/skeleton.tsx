import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-bg-overlay",
        "motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
