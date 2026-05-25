"use client";

import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import type { Sector } from "@/lib/types";
import { formatCompact } from "@/lib/utils/format";

interface Datum {
  symbol: string;
  value: number;
  sector: Sector | string;
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: "hsl(188 78% 48%)",
  Semiconductors: "hsl(188 60% 38%)",
  Financials: "hsl(210 80% 56%)",
  Energy: "hsl(38 92% 55%)",
  Consumer: "hsl(270 50% 60%)",
  Healthcare: "hsl(142 70% 45%)",
  Biotech: "hsl(142 50% 35%)",
  Communication: "hsl(0 60% 56%)",
  Industrial: "hsl(220 14% 60%)",
  Utilities: "hsl(220 20% 50%)",
  Materials: "hsl(38 50% 40%)",
  RealEstate: "hsl(0 30% 50%)",
  Crypto: "hsl(45 90% 55%)",
  Index: "hsl(220 10% 50%)",
  Macro: "hsl(220 10% 40%)",
  Other: "hsl(220 8% 38%)",
};

function colorFor(sector: string, index: number): string {
  return SECTOR_COLORS[sector] ?? `hsl(${(index * 53) % 360} 50% 50%)`;
}

export interface AllocationDonutProps {
  data: Datum[];
}

export function AllocationDonut({ data }: AllocationDonutProps) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-2xs text-text-subtle">No allocation to chart yet.</p>;
  }
  return (
    <div className="flex h-[260px] flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="symbol"
            innerRadius={50}
            outerRadius={88}
            paddingAngle={1}
            stroke="hsl(220 14% 6%)"
          >
            {data.map((d, i) => (
              <Cell key={d.symbol} fill={colorFor(String(d.sector), i)} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0]?.payload as Datum;
              return (
                <div className="rounded border border-border bg-bg-overlay px-2 py-1 text-2xs">
                  <div className="font-mono font-medium text-text">{d.symbol}</div>
                  <div className="text-text-muted">${formatCompact(d.value)}</div>
                  <div className="text-text-subtle">{String(d.sector)}</div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value) => (
              <span className="font-mono text-2xs text-text-muted">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
