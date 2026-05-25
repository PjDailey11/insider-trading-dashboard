"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type SeriesMarker,
  type LineWidth,
} from "lightweight-charts";
import { useCandles } from "@/lib/hooks/useCandles";
import { usePoliticianTradesForSymbol } from "@/lib/hooks/usePoliticianTrades";
import { usePoliticians } from "@/lib/hooks/usePoliticians";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Candle, CandleInterval, PoliticianTrade, Politician } from "@/lib/types";
import { bucketImportance, bucketLabel } from "@/lib/utils/politician";

const INTERVALS: Array<{ id: CandleInterval; label: string }> = [
  { id: "5m", label: "5m" },
  { id: "1d", label: "1D" },
  { id: "1w", label: "1W" },
];

const INDICATORS = [
  { id: "sma20", label: "SMA 20" },
  { id: "sma50", label: "SMA 50" },
  { id: "ema21", label: "EMA 21" },
  { id: "vwap", label: "VWAP" },
  { id: "rsi", label: "RSI" },
] as const;

type IndicatorKey = (typeof INDICATORS)[number]["id"];

export interface ChartCardProps {
  symbol: string;
  height?: number;
}

export function ChartCard({ symbol, height = 460 }: ChartCardProps) {
  const [interval, setInterval] = useState<CandleInterval>("1d");
  const [enabled, setEnabled] = useState<Record<IndicatorKey, boolean>>({
    sma20: true,
    sma50: false,
    ema21: false,
    vwap: false,
    rsi: false,
  });
  const [showPolitician, setShowPolitician] = useState(true);

  const { data: candles, isLoading } = useCandles(symbol, interval);
  const { data: trades } = usePoliticianTradesForSymbol(symbol, { limit: 80 });
  const { data: politicians } = usePoliticians();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlayRefs = useRef<Partial<Record<IndicatorKey, ISeriesApi<"Line">>>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
        textColor: "#9aa1ab",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1b1e24" },
        horzLines: { color: "#1b1e24" },
      },
      timeScale: { borderColor: "#252932", timeVisible: interval !== "1d" && interval !== "1w" },
      rightPriceScale: { borderColor: "#252932" },
      crosshair: { mode: 1 },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      borderUpColor: "#22c55e",
      wickUpColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      wickDownColor: "#ef4444",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#5a6068",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
      visible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      overlayRefs.current = {};
    };
  }, [interval]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles) return;
    const candleData: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.t as Time,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));
    const volumeData: HistogramData<Time>[] = candles.map((c) => ({
      time: c.t as Time,
      value: c.v,
      color: c.c >= c.o ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)",
    }));
    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    updateIndicators(candles, enabled, chartRef.current!, overlayRefs.current);
    chartRef.current?.timeScale().fitContent();
  }, [candles, enabled]);

  // Politician trade markers
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (!showPolitician || !trades || trades.length === 0) {
      candleSeriesRef.current.setMarkers([]);
      return;
    }
    const polById = new Map((politicians ?? []).map((p) => [p.id, p]));
    const markers = buildTradeMarkers(trades, polById, candles ?? []);
    candleSeriesRef.current.setMarkers(markers);
  }, [trades, politicians, showPolitician, candles]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-2.5">
        <div className="flex items-center gap-0.5 rounded border border-border bg-bg-sunken p-0.5">
          {INTERVALS.map((i) => (
            <button
              key={i.id}
              onClick={() => setInterval(i.id)}
              className={cn(
                "rounded-sm px-2 py-0.5 text-2xs font-mono uppercase tracking-wider",
                interval === i.id
                  ? "bg-accent text-accent-fg"
                  : "text-text-muted hover:text-text",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 rounded border border-border bg-bg-sunken p-0.5">
          {INDICATORS.map((i) => (
            <button
              key={i.id}
              onClick={() => setEnabled((p) => ({ ...p, [i.id]: !p[i.id] }))}
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-2xs font-mono uppercase tracking-wider",
                enabled[i.id]
                  ? "bg-bg-overlay text-text"
                  : "text-text-subtle hover:text-text",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="pol-overlay" className="text-2xs">
            Politician trades
          </Label>
          <Switch
            id="pol-overlay"
            checked={showPolitician}
            onCheckedChange={setShowPolitician}
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <Skeleton style={{ height }} className="m-3 w-[calc(100%-24px)]" />
        ) : null}
        <div ref={containerRef} className="h-full w-full" style={{ minHeight: height }} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Indicators
// ────────────────────────────────────────────────────────────────────────────

function updateIndicators(
  candles: Candle[],
  enabled: Record<IndicatorKey, boolean>,
  chart: IChartApi,
  refs: Partial<Record<IndicatorKey, ISeriesApi<"Line">>>,
): void {
  const ensure = (
    key: IndicatorKey,
    options: { color: string; lineWidth?: LineWidth },
  ): ISeriesApi<"Line"> => {
    let series = refs[key];
    if (!series) {
      series = chart.addLineSeries({
        color: options.color,
        lineWidth: options.lineWidth ?? 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      refs[key] = series;
    }
    return series;
  };

  const removeIfDisabled = (key: IndicatorKey) => {
    if (refs[key] && !enabled[key]) {
      chart.removeSeries(refs[key]!);
      delete refs[key];
    }
  };

  if (enabled.sma20) {
    const series = ensure("sma20", { color: "#f59e0b" });
    series.setData(sma(candles, 20));
  } else removeIfDisabled("sma20");

  if (enabled.sma50) {
    const series = ensure("sma50", { color: "#3b82f6" });
    series.setData(sma(candles, 50));
  } else removeIfDisabled("sma50");

  if (enabled.ema21) {
    const series = ensure("ema21", { color: "#06b6d4" });
    series.setData(ema(candles, 21));
  } else removeIfDisabled("ema21");

  if (enabled.vwap) {
    const series = ensure("vwap", { color: "#a855f7" });
    series.setData(vwap(candles));
  } else removeIfDisabled("vwap");

  if (enabled.rsi) {
    const series = ensure("rsi", { color: "#f59e0b" });
    series.setData(rsi(candles, 14));
  } else removeIfDisabled("rsi");
}

function sma(candles: Candle[], period: number): LineData<Time>[] {
  const out: LineData<Time>[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i]!.c;
    if (i >= period) sum -= candles[i - period]!.c;
    if (i >= period - 1) out.push({ time: candles[i]!.t as Time, value: +(sum / period).toFixed(4) });
  }
  return out;
}

function ema(candles: Candle[], period: number): LineData<Time>[] {
  const out: LineData<Time>[] = [];
  const k = 2 / (period + 1);
  let prev = candles[0]?.c ?? 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!.c;
    prev = i === 0 ? c : c * k + prev * (1 - k);
    if (i >= period - 1) out.push({ time: candles[i]!.t as Time, value: +prev.toFixed(4) });
  }
  return out;
}

function vwap(candles: Candle[]): LineData<Time>[] {
  const out: LineData<Time>[] = [];
  let pv = 0;
  let v = 0;
  for (const c of candles) {
    const typical = (c.h + c.l + c.c) / 3;
    pv += typical * c.v;
    v += c.v;
    if (v > 0) out.push({ time: c.t as Time, value: +(pv / v).toFixed(4) });
  }
  return out;
}

function rsi(candles: Candle[], period = 14): LineData<Time>[] {
  if (candles.length <= period) return [];
  const out: LineData<Time>[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i]!.c - candles[i - 1]!.c;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i]!.c - candles[i - 1]!.c;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiVal = 100 - 100 / (1 + rs);
    out.push({ time: candles[i]!.t as Time, value: +rsiVal.toFixed(2) });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Politician markers
// ────────────────────────────────────────────────────────────────────────────

function buildTradeMarkers(
  trades: PoliticianTrade[],
  polById: Map<string, Politician>,
  candles: Candle[],
): SeriesMarker<Time>[] {
  if (candles.length === 0) return [];
  const candleTimes = candles.map((c) => c.t);
  const firstT = candleTimes[0]!;
  const lastT = candleTimes[candleTimes.length - 1]!;

  // Group by candle bucket time
  const grouped = new Map<number, PoliticianTrade[]>();
  for (const t of trades) {
    const candleT = nearestCandleTime(Math.floor(t.tradeDate / 1000), candleTimes);
    if (candleT < firstT || candleT > lastT) continue;
    const list = grouped.get(candleT) ?? [];
    list.push(t);
    grouped.set(candleT, list);
  }

  const markers: SeriesMarker<Time>[] = [];
  for (const [time, group] of grouped.entries()) {
    const buys = group.filter((g) => g.side === "buy").length;
    const sells = group.filter((g) => g.side === "sell").length;
    const dominantSide = buys >= sells ? "buy" : "sell";
    const maxImportance = Math.max(...group.map((g) => bucketImportance(g.amountBucket)));
    const size = maxImportance >= 4 ? 3 : maxImportance >= 3 ? 2 : 1;
    markers.push({
      time: time as Time,
      position: dominantSide === "buy" ? "belowBar" : "aboveBar",
      shape: dominantSide === "buy" ? "arrowUp" : "arrowDown",
      color: dominantSide === "buy" ? "#34d399" : "#f87171",
      text:
        group.length === 1
          ? `${polById.get(group[0]!.politicianId)?.name?.split(" ").slice(-1)[0] ?? ""} ${bucketLabel(group[0]!.amountBucket)}`
          : `${group.length} trades`,
      size: size as 1 | 2 | 3,
    });
  }
  return markers.sort(
    (a, b) => (a.time as number) - (b.time as number),
  );
}

function nearestCandleTime(target: number, sorted: number[]): number {
  if (sorted.length === 0) return target;
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  const candidate = sorted[lo]!;
  if (lo > 0) {
    const prev = sorted[lo - 1]!;
    if (Math.abs(prev - target) < Math.abs(candidate - target)) return prev;
  }
  return candidate;
}
