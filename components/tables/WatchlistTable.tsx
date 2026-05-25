"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, X, Sliders, Columns3 } from "lucide-react";
import type { Quote } from "@/lib/types";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { useTickers } from "@/lib/hooks/useTickers";
import { useWatchlistsStore } from "@/lib/stores/watchlistsStore";
import { formatPrice, formatPercent, formatVolume } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type WatchlistDensity = "comfortable" | "compact";

interface Row {
  symbol: string;
  name?: string;
  quote: Quote | undefined;
}

export interface WatchlistTableProps {
  watchlistId: string;
  density?: WatchlistDensity;
  onDensityChange?: (density: WatchlistDensity) => void;
}

const COLUMN_LABELS: Record<string, string> = {
  symbol: "Symbol",
  name: "Name",
  last: "Last",
  change: "Chg",
  changePct: "Chg %",
  open: "Open",
  high: "High",
  low: "Low",
  volume: "Vol",
  avgVolume: "Avg Vol",
  remove: " ",
};

export function WatchlistTable({
  watchlistId,
  density: densityProp,
  onDensityChange,
}: WatchlistTableProps) {
  const watchlist = useWatchlistsStore((s) =>
    s.items.find((w) => w.id === watchlistId),
  );
  const removeSymbol = useWatchlistsStore((s) => s.removeSymbol);
  const { data: tickers } = useTickers();
  const { data: quotes, isLoading } = useQuotes(watchlist?.symbols ?? []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalDensity, setInternalDensity] =
    useState<WatchlistDensity>("comfortable");
  const density = densityProp ?? internalDensity;
  const setDensity = onDensityChange ?? setInternalDensity;
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    symbol: true,
    name: true,
    last: true,
    change: true,
    changePct: true,
    open: true,
    high: true,
    low: true,
    volume: true,
    avgVolume: false,
    remove: true,
  });

  const tickersBySymbol = useMemo(
    () => new Map((tickers ?? []).map((t) => [t.symbol, t])),
    [tickers],
  );
  const quotesBySymbol = useMemo(
    () => new Map((quotes ?? []).map((q) => [q.symbol, q])),
    [quotes],
  );

  const rows: Row[] = useMemo(() => {
    const symbols = watchlist?.symbols ?? [];
    return symbols.map((symbol) => ({
      symbol,
      name: tickersBySymbol.get(symbol)?.name,
      quote: quotesBySymbol.get(symbol),
    }));
  }, [watchlist, tickersBySymbol, quotesBySymbol]);

  const columnHelper = createColumnHelper<Row>();
  const columns = useMemo(() => {
    return [
      columnHelper.accessor("symbol", {
        header: "Symbol",
        cell: (info) => (
          <Link
            href={`/s/${info.getValue()}`}
            className="font-mono font-medium text-text hover:text-accent"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="truncate text-text-muted">{info.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor((r) => r.quote?.last, {
        id: "last",
        header: () => <span className="text-right block">Last</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular text-text" data-tabular="true">
            {info.getValue() === undefined ? "—" : formatPrice(info.getValue() as number)}
          </span>
        ),
        sortDescFirst: true,
      }),
      columnHelper.accessor((r) => r.quote?.change, {
        id: "change",
        header: () => <span className="text-right block">Chg</span>,
        cell: (info) => {
          const v = info.getValue() as number | undefined;
          if (v === undefined) return <span className="block text-right">—</span>;
          return (
            <span
              className={cn(
                "block text-right font-mono tabular",
                v > 0 ? "num-up" : v < 0 ? "num-down" : "num-flat",
              )}
              data-tabular="true"
            >
              {v > 0 ? "+" : ""}
              {v.toFixed(2)}
            </span>
          );
        },
        sortDescFirst: true,
      }),
      columnHelper.accessor((r) => r.quote?.changePct, {
        id: "changePct",
        header: () => <span className="text-right block">Chg %</span>,
        cell: (info) => {
          const v = info.getValue() as number | undefined;
          if (v === undefined) return <span className="block text-right">—</span>;
          return (
            <span
              className={cn(
                "block text-right font-mono tabular",
                v > 0 ? "num-up" : v < 0 ? "num-down" : "num-flat",
              )}
              data-tabular="true"
            >
              {formatPercent(v)}
            </span>
          );
        },
        sortDescFirst: true,
      }),
      columnHelper.accessor((r) => r.quote?.open, {
        id: "open",
        header: () => <span className="text-right block">Open</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular text-text-muted" data-tabular="true">
            {info.getValue() === undefined ? "—" : formatPrice(info.getValue() as number)}
          </span>
        ),
      }),
      columnHelper.accessor((r) => r.quote?.high, {
        id: "high",
        header: () => <span className="text-right block">High</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular text-text-muted" data-tabular="true">
            {info.getValue() === undefined ? "—" : formatPrice(info.getValue() as number)}
          </span>
        ),
      }),
      columnHelper.accessor((r) => r.quote?.low, {
        id: "low",
        header: () => <span className="text-right block">Low</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular text-text-muted" data-tabular="true">
            {info.getValue() === undefined ? "—" : formatPrice(info.getValue() as number)}
          </span>
        ),
      }),
      columnHelper.accessor((r) => r.quote?.volume, {
        id: "volume",
        header: () => <span className="text-right block">Vol</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular text-text-muted" data-tabular="true">
            {info.getValue() === undefined ? "—" : formatVolume(info.getValue() as number)}
          </span>
        ),
      }),
      columnHelper.accessor((r) => r.quote?.avgVolume, {
        id: "avgVolume",
        header: () => <span className="text-right block">Avg Vol</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular text-text-muted" data-tabular="true">
            {info.getValue() === undefined ? "—" : formatVolume(info.getValue() as number)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "remove",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={() => removeSymbol(watchlistId, row.original.symbol)}
            className="rounded p-0.5 text-text-subtle opacity-0 hover:bg-bg-overlay hover:text-loss group-hover:opacity-100"
            aria-label={`Remove ${row.original.symbol}`}
          >
            <X className="h-3 w-3" />
          </button>
        ),
      }),
    ];
  }, [columnHelper, removeSymbol, watchlistId]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility: visibleColumns },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibleColumns as never,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tableRows = table.getRowModel().rows;
  const rowHeight = density === "compact" ? 24 : 32;
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  if (!watchlist) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-xs text-text-muted">
        Watchlist not found.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-bg-raised px-3">
        <span className="text-xs font-medium text-text">{watchlist.name}</span>
        <span className="rounded-sm bg-bg-overlay px-1 font-mono text-2xs text-text-subtle">
          {watchlist.symbols.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Columns3 className="h-3 w-3" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(Boolean(v))}
                >
                  {COLUMN_LABELS[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
          >
            <Sliders className="h-3 w-3" /> {density === "compact" ? "Compact" : "Comfy"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-7 items-center border-b border-border bg-bg-sunken text-2xs uppercase tracking-wider text-text-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} className="grid w-full" style={gridStyle}>
              {headerGroup.headers.map((header) => (
                <button
                  key={header.id}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className={cn(
                    "flex h-7 items-center gap-1 truncate px-2 text-left hover:text-text",
                    header.column.getIsSorted() && "text-text",
                    !header.column.getCanSort() && "cursor-default",
                  )}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" ? (
                    <ArrowUp className="h-2.5 w-2.5" />
                  ) : header.column.getIsSorted() === "desc" ? (
                    <ArrowDown className="h-2.5 w-2.5" />
                  ) : header.column.getCanSort() ? (
                    <ArrowUpDown className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50" />
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div ref={containerRef} className="h-[calc(100%-28px)] overflow-auto">
          {isLoading ? (
            <div className="flex flex-col gap-1 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : tableRows.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted">
              No symbols in this watchlist yet.
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((vRow) => {
                const row = tableRows[vRow.index]!;
                return (
                  <div
                    key={row.id}
                    className="group absolute left-0 top-0 grid w-full items-center border-b border-border-muted text-xs row-hover"
                    style={{
                      transform: `translateY(${vRow.start}px)`,
                      height: `${rowHeight}px`,
                      ...gridStyle,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id} className="truncate px-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  gridTemplateColumns:
    "80px minmax(0, 1fr) 78px 70px 70px 70px 70px 70px 78px 78px 24px",
};
