"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  region?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.region ? ` ${this.props.region}` : ""}]`, error, info);
  }

  reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (error) {
      if (fallback) return fallback(error, this.reset);
      return (
        <div className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 p-4 text-center">
          <div className="flex items-center gap-1.5 text-warn">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Panel failed to render</span>
          </div>
          <p className="max-w-sm text-2xs text-text-muted">{error.message}</p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            <RefreshCcw className="h-3 w-3" /> Retry
          </Button>
        </div>
      );
    }
    return children;
  }
}
