"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Plus, Save, Trash2, Search } from "lucide-react";
import { useTickers } from "@/lib/hooks/useTickers";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { useScreenerStore } from "@/lib/stores/screenerStore";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPercent, formatCompact, formatMarketCap } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ScreenerCriterion } from "@/lib/types";
import { toast } from "sonner";

interface FieldDef {
  id: string;
  label: string;
  unit?: string;
}

const FIELDS: FieldDef[] = [
  { id: "price", label: "Last price", unit: "$" },
  { id: "changePct", label: "Change %", unit: "%" },
  { id: "volume", label: "Volume" },
  { id: "marketCap", label: "Market cap", unit: "$" },
  { id: "spread", label: "Spread", unit: "$" },
];

const OPS: Array<{ id: ScreenerCriterion["op"]; label: string }> = [
  { id: "gt", label: ">" },
  { id: "gte", label: "≥" },
  { id: "lt", label: "<" },
  { id: "lte", label: "≤" },
  { id: "eq", label: "=" },
];

export function ScreenerView() {
  const draft = useScreenerStore((s) => s.draft);
  const setDraft = useScreenerStore((s) => s.setDraft);
  const saveScreen = useScreenerStore((s) => s.saveScreen);
  const saved = useScreenerStore((s) => s.saved);
  const loadScreen = useScreenerStore((s) => s.loadScreen);
  const deleteScreen = useScreenerStore((s) => s.deleteScreen);
  const [saveName, setSaveName] = useState("");

  const { data: tickers } = useTickers();
  const filtered = useMemo(
    () =>
      (tickers ?? []).filter(
        (t) => t.exchange !== "INDEX" && t.exchange !== "BOND" && t.exchange !== "FX",
      ),
    [tickers],
  );
  const { data: quotes } = useQuotes(filtered.map((t) => t.symbol));
  const quoteBySymbol = useMemo(
    () => new Map((quotes ?? []).map((q) => [q.symbol, q])),
    [quotes],
  );

  const results = useMemo(() => {
    return filtered
      .map((t) => {
        const q = quoteBySymbol.get(t.symbol);
        return {
          symbol: t.symbol,
          name: t.name,
          sector: t.sector,
          price: q?.last ?? 0,
          changePct: q?.changePct ?? 0,
          volume: q?.volume ?? 0,
          marketCap: t.marketCap ?? 0,
          spread: q?.spread ?? 0,
        };
      })
      .filter((row) => draft.every((c) => evaluate(row, c)))
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, 200);
  }, [filtered, quoteBySymbol, draft]);

  const addCriterion = () => {
    setDraft([
      ...draft,
      { field: "marketCap", op: "gt", value: 50_000_000_000 },
    ]);
  };

  return (
    <main className="grid grid-cols-12 gap-3 p-3">
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
        <Panel
          title={
            <span className="flex items-center gap-1.5 font-medium text-text">
              <Filter className="h-3.5 w-3.5 text-text-subtle" /> Filters
            </span>
          }
          density="compact"
          bodyClassName="p-3 flex flex-col gap-2"
        >
          {draft.length === 0 ? (
            <p className="text-2xs text-text-subtle">
              No filters. Add one to narrow the universe.
            </p>
          ) : (
            draft.map((c, i) => (
              <FilterRow
                key={i}
                criterion={c}
                onChange={(updated) =>
                  setDraft(draft.map((x, idx) => (idx === i ? updated : x)))
                }
                onRemove={() => setDraft(draft.filter((_, idx) => idx !== i))}
              />
            ))
          )}
          <Button variant="outline" size="sm" onClick={addCriterion}>
            <Plus className="h-3 w-3" /> Add criterion
          </Button>

          <div className="mt-3 border-t border-border pt-3 flex flex-col gap-1.5">
            <Label htmlFor="screen-name">Save as…</Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="screen-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My screen"
              />
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!saveName.trim()) {
                    toast.error("Name required");
                    return;
                  }
                  const s = saveScreen(saveName.trim());
                  toast.success(`Saved screen: ${s.name}`);
                  setSaveName("");
                }}
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {saved.length > 0 ? (
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-2xs uppercase tracking-wider text-text-muted">Saved screens</span>
              {saved.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-1.5 rounded border border-border-muted bg-bg-sunken px-2 py-1.5"
                >
                  <button
                    onClick={() => loadScreen(s.id)}
                    className="flex-1 text-left text-xs text-text hover:text-accent"
                  >
                    {s.name}
                  </button>
                  <span className="text-2xs text-text-subtle">{s.criteria.length} rules</span>
                  <button
                    onClick={() => deleteScreen(s.id)}
                    className="rounded p-0.5 text-text-subtle opacity-0 hover:text-loss group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="col-span-12 lg:col-span-9">
        <Panel
          title={
            <span className="flex items-center gap-1.5 font-medium text-text">
              <Search className="h-3.5 w-3.5 text-text-subtle" /> Results
              <Badge variant="muted" className="ml-1">{results.length}</Badge>
            </span>
          }
          density="compact"
          bodyClassName="p-0 overflow-auto max-h-[640px]"
        >
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg-sunken text-2xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Symbol</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Sector</th>
                <th className="px-3 py-2 text-right font-medium">Last</th>
                <th className="px-3 py-2 text-right font-medium">Chg %</th>
                <th className="px-3 py-2 text-right font-medium">Vol</th>
                <th className="px-3 py-2 text-right font-medium">Mkt cap</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.symbol} className="border-t border-border-muted row-hover">
                  <td className="px-3 py-1.5">
                    <Link href={`/s/${r.symbol}`} className="font-mono font-medium text-text hover:text-accent">
                      {r.symbol}
                    </Link>
                  </td>
                  <td className="truncate px-3 py-1.5 text-text-muted">{r.name}</td>
                  <td className="px-3 py-1.5 text-text-subtle">{r.sector}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular text-text" data-tabular="true">
                    {formatPrice(r.price)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-1.5 text-right font-mono tabular",
                      r.changePct > 0 ? "num-up" : r.changePct < 0 ? "num-down" : "num-flat",
                    )}
                    data-tabular="true"
                  >
                    {formatPercent(r.changePct)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular text-text-muted" data-tabular="true">
                    {formatCompact(r.volume)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular text-text-muted" data-tabular="true">
                    {r.marketCap ? formatMarketCap(r.marketCap) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </main>
  );
}

function FilterRow({
  criterion,
  onChange,
  onRemove,
}: {
  criterion: ScreenerCriterion;
  onChange: (c: ScreenerCriterion) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_44px_1fr_auto] items-end gap-1.5 rounded border border-border-muted bg-bg-sunken p-2">
      <Select value={criterion.field} onValueChange={(v) => onChange({ ...criterion, field: v })}>
        <SelectTrigger className="h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={criterion.op} onValueChange={(v) => onChange({ ...criterion, op: v as ScreenerCriterion["op"] })}>
        <SelectTrigger className="h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPS.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        className="h-7"
        value={typeof criterion.value === "number" ? criterion.value : 0}
        onChange={(e) => onChange({ ...criterion, value: Number(e.target.value) })}
      />
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function evaluate(row: Record<string, unknown>, c: ScreenerCriterion): boolean {
  const v = row[c.field];
  if (typeof v !== "number") return true;
  const target = typeof c.value === "number" ? c.value : Number(c.value);
  if (Number.isNaN(target)) return true;
  switch (c.op) {
    case "gt":
      return v > target;
    case "gte":
      return v >= target;
    case "lt":
      return v < target;
    case "lte":
      return v <= target;
    case "eq":
      return Math.abs(v - target) < 1e-6;
    default:
      return true;
  }
}
