"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState, useEffect, type ReactNode } from "react";
import { bootstrapPersistence } from "@/lib/persistence/bootstrap";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { KeyboardShortcuts } from "@/components/shell/KeyboardShortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    void bootstrapPersistence();
  }, []);

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        {children}
        <CommandPalette />
        <KeyboardShortcuts />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(220 14% 11%)",
              border: "1px solid hsl(220 10% 16%)",
              color: "hsl(220 14% 92%)",
              fontSize: "12px",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
