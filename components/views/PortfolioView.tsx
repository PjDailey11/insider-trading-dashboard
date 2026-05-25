"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, PieChart as PieIcon } from "lucide-react";
import { usePositionsStore } from "@/lib/stores/positionsStore";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { useTickers } from "@/lib/hooks/useTickers";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/market/MetricCard";
import { PnLBadge } from "@/components/market/PnLBadge";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { formatPrice, formatPercent, formatCompact } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { AddPositionDrawer } from "@/components/portfolio/AddPositionDrawer";
import { AllocationDonut } from "@/components/portfolio/AllocationDonut";
import { EmptyState } from "@/components/EmptyState";

export function PortfolioView() {
  const [open, setOpen] = useState(false);
  const positions = usePositionsStore((s) => s.items);
  const remove = usePositionsStore((s) => s.remove);
  const symbols = positions.map((p) => p.symbol);
  const { data: quotes } = useQuotes(symbols);
  const { data: tickers } = useTickers();

  const quotesBySymbol = new Map((quotes ?? []).map((q) => [q.symbol, q]));
  const tickersBySymbol = new Map((tickers ?? []).map((t) => [t.symbol, t]));

  const enriched = positions.map((p) => {
    const q = quotesBySymbol.get(p.symbol);
    const price = q?.last ?? p.avgCost;
    const value = price * p.quantity;
    const cost = p.avgCost * p.quantity;
    const pnl = value - cost;
    const pnlPct = cost === 0 ? 0 : (pnl / cost) * 100;
    const dayPnl = (q?.change ?? 0) * p.quantity;
    const dayPnlPct = q?.changePct ?? 0;
    return { p, q, price, value, cost, pnl, pnlPct, dayPnl, dayPnlPct };
  });

  const totals = useMemo(() => {
    const value = enriched.reduce((s, x) => s + x.value, 0);
    const cost = enriched.reduce((s, x) => s + x.cost, 0);
    const pnl = value - cost;
    const dayPnl = enriched.reduce((s, x) => s + x.dayPnl, 0);
    return {
      value,
      cost,
      pnl,
      pnlPct: cost === 0 ? 0 : (pnl / cost) * 100,
      dayPnl,
      dayPnlPct: value === 0 ? 0 : (dayPnl / (value - dayPnl)) * 100,
    };
  }, [enriched]);

  const allocation = enriched
    .map((x) => ({
      symbol: x.p.symbol,
      value: x.value,
      sector: tickersBySymbol.get(x.p.symbol)?.sector ?? "Other",
    }))
    .filter((x) => x.value > 0);

  return (
    <main className="grid grid-cols-12 gap-3 p-3">
      <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total value" value={`$${formatCompact(totals.value)}`} />
        <MetricCard
          label="Day P/L"
          value={
            <PnLBadge value={totals.dayPnl} percent={totals.dayPnlPct} size="md" />
          }
        />
        <MetricCard
          label="Open P/L"
          value={<PnLBadge value={totals.pnl} percent={totals.pnlPct} size="md" />}
        />
        <MetricCard label="Cost basis" value={`$${formatCompact(totals.cost)}`} />
      </div>

      <div className="col-span-12 xl:col-span-8 flex flex-col gap-3">
        <ErrorBoundary region="positions">
          <Panel
            title={<span className="font-medium text-text">Positions</span>}
            actions={
              <Button variant="default" size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-3 w-3" /> Add position
              </Button>
            }
            density="compact"
            bodyClassName="p-0"
          >
            {enriched.length === 0 ? (
              <EmptyState
                icon={<PieIcon className="h-5 w-5" />}
                title="No positions yet"
                description="Add a position to track P/L against live quotes."
                action={
                  <Button variant="default" size="sm" onClick={() => setOpen(true)}>
                    <Plus className="h-3 w-3" /> Add position
                  </Button>
                }
              />
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-bg-sunken text-2xs uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Avg cost</th>
                    <th className="px-3 py-2 text-right font-medium">Last</th>
                    <th className="px-3 py-2 text-right font-medium">Value</th>
                    <th className="px-3 py-2 text-right font-medium">Day P/L</th>
                    <th className="px-3 py-2 text-right font-medium">Open P/L</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((x) => (
                    <tr key={x.p.id} className="group border-t border-border-muted row-hover">
                      <td className="px-3 py-2">
                        <Link href={`/s/${x.p.symbol}`} className="font-mono font-medium text-text hover:text-accent">
                          {x.p.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular" data-tabular="true">
                        {x.p.quantity}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular text-text-muted" data-tabular="true">
                        {formatPrice(x.p.avgCost)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular text-text" data-tabular="true">
                        {formatPrice(x.price)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular text-text" data-tabular="true">
                        {formatPrice(x.value)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <PnLBadge value={x.dayPnl} percent={x.dayPnlPct} size="sm" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <PnLBadge value={x.pnl} percent={x.pnlPct} size="sm" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => remove(x.p.id)}
                          className="rounded p-0.5 text-text-subtle opacity-0 transition-opacity hover:bg-bg-overlay hover:text-loss group-hover:opacity-100"
                          aria-label={`Remove ${x.p.symbol}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </ErrorBoundary>
      </div>

      <div className="col-span-12 xl:col-span-4">
        <ErrorBoundary region="allocation">
          <Panel
            title={<span className="font-medium text-text">Allocation</span>}
            density="compact"
            bodyClassName="p-3"
          >
            <AllocationDonut data={allocation} />
          </Panel>
        </ErrorBoundary>
      </div>

      <AddPositionDrawer open={open} onOpenChange={setOpen} />
    </main>
  );
}
