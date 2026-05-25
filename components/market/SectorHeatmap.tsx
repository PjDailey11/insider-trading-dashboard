"use client";

import { useMemo } from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import type { Sector } from "@/lib/types";
import { useTickers } from "@/lib/hooks/useTickers";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/utils/format";

interface NodeDatum {
  name: string;
  symbol?: string;
  value: number;
  changePct: number;
  sector?: Sector;
  children?: NodeDatum[];
}

const TRACKED_SECTORS: Sector[] = [
  "Technology",
  "Semiconductors",
  "Financials",
  "Healthcare",
  "Energy",
  "Consumer",
  "Communication",
  "Industrial",
  "Biotech",
];

export interface SectorHeatmapProps {
  height?: number;
}

export function SectorHeatmap({ height = 260 }: SectorHeatmapProps) {
  const { data: tickers } = useTickers();
  const eligible = useMemo(
    () =>
      (tickers ?? []).filter(
        (t) => TRACKED_SECTORS.includes(t.sector) && t.marketCap && t.marketCap > 30e9,
      ),
    [tickers],
  );
  const { data: quotes, isLoading } = useQuotes(eligible.map((t) => t.symbol));

  const data: NodeDatum = useMemo(() => {
    const map = new Map<string, NodeDatum>();
    const quoteMap = new Map((quotes ?? []).map((q) => [q.symbol, q]));
    for (const ticker of eligible) {
      const q = quoteMap.get(ticker.symbol);
      if (!q) continue;
      const sector = ticker.sector;
      const node = map.get(sector) ?? {
        name: sector,
        value: 0,
        changePct: 0,
        children: [],
        sector,
      };
      node.children!.push({
        name: ticker.symbol,
        symbol: ticker.symbol,
        value: Math.max(1, (ticker.marketCap ?? 1e9) / 1e9),
        changePct: q.changePct,
      });
      map.set(sector, node);
    }
    // Aggregate sector value/changePct from children
    for (const node of map.values()) {
      const children = node.children ?? [];
      node.value = children.reduce((s, c) => s + c.value, 0);
      const totalWeight = node.value;
      node.changePct =
        totalWeight > 0
          ? children.reduce((s, c) => s + c.changePct * c.value, 0) / totalWeight
          : 0;
    }
    return { name: "Market", value: 0, changePct: 0, children: [...map.values()] };
  }, [eligible, quotes]);

  if (isLoading) {
    return <Skeleton style={{ height }} className="w-full" />;
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={data.children}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="hsl(220 14% 6%)"
          content={<HeatmapTile />}
        >
          <Tooltip content={<HeatmapTooltip />} cursor={{ fill: "transparent" }} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

function tintForChange(changePct: number): string {
  const clamped = Math.max(-5, Math.min(5, changePct));
  const intensity = Math.abs(clamped) / 5;
  if (clamped >= 0.05) {
    // gain (hsl 142 70% L)
    const lightness = 14 + intensity * 28; // 14..42
    return `hsl(142 70% ${lightness}%)`;
  }
  if (clamped <= -0.05) {
    const lightness = 14 + intensity * 28;
    return `hsl(6 78% ${lightness}%)`;
  }
  return "hsl(220 12% 12%)";
}

interface TileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: NodeDatum;
  name?: string;
  symbol?: string;
  changePct?: number;
  depth?: number;
  root?: unknown;
}

function HeatmapTile(props: TileProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, changePct, symbol } = props;
  if (width <= 0 || height <= 0) return null;
  const fill = tintForChange(typeof changePct === "number" ? changePct : 0);
  const label = symbol ?? name;
  const showLabel = width > 40 && height > 22;
  const showPct = width > 56 && height > 36;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="hsl(220 14% 6%)"
        strokeWidth={1}
      />
      {showLabel ? (
        <text
          x={x + 4}
          y={y + 12}
          fill="hsl(220 14% 92%)"
          fontFamily="var(--font-jetbrains-mono)"
          fontSize="10"
          fontWeight="500"
        >
          {label}
        </text>
      ) : null}
      {showPct && typeof changePct === "number" ? (
        <text
          x={x + 4}
          y={y + 24}
          fill="hsl(220 14% 92% / 0.8)"
          fontFamily="var(--font-jetbrains-mono)"
          fontSize="9"
        >
          {formatPercent(changePct)}
        </text>
      ) : null}
    </g>
  );
}

interface TooltipShape {
  active?: boolean;
  payload?: Array<{ payload: NodeDatum }>;
}

function HeatmapTooltip({ active, payload }: TooltipShape) {
  if (!active || !payload || !payload.length) return null;
  const datum = payload[0]!.payload;
  return (
    <div className="rounded border border-border bg-bg-overlay px-2 py-1 text-2xs shadow-popover">
      <div className="font-mono font-medium text-text">{datum.name}</div>
      <div
        className={
          datum.changePct > 0
            ? "font-mono num-up"
            : datum.changePct < 0
              ? "font-mono num-down"
              : "font-mono num-flat"
        }
      >
        {formatPercent(datum.changePct)}
      </div>
    </div>
  );
}
