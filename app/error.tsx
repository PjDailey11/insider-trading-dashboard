"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <main className="flex h-full items-center justify-center p-12">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-md font-medium text-loss">Something went wrong</h1>
        <p className="text-xs text-text-muted">{error.message}</p>
        <Button variant="secondary" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
