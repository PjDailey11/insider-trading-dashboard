import type { Candle, CandleInterval, Quote, Sector, Ticker } from "@/lib/types";
import { getPolygonApiKey } from "./env";

const BASE = "https://api.polygon.io";

/** Map strip display symbols to Polygon tickers when live. */
export const STRIP_POLYGON_MAP: Record<string, string> = {
  SPX: "SPY",
  NDX: "QQQ",
  DJI: "DIA",
  RUT: "IWM",
  VIX: "VIXY",
  US02Y: "SHY",
  US10Y: "IEF",
  DXY: "UUP",
  GOLD: "GLD",
  WTI: "USO",
  BTC: "X:BTCUSD",
  ETH: "X:ETHUSD",
};

/** Resolve dashboard display symbol to a Polygon aggs/snapshot ticker. */
export function resolvePolygonTicker(displaySymbol: string): string {
  const upper = displaySymbol.trim().toUpperCase();
  return STRIP_POLYGON_MAP[upper] ?? upper;
}

const SIC_SECTOR: Record<string, Sector> = {
  "7370": "Technology",
  "7372": "Technology",
  "3571": "Technology",
  "2834": "Healthcare",
  "6021": "Financials",
  "1311": "Energy",
};

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly provider = "polygon",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

async function polygonFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = getPolygonApiKey();
  if (!apiKey) {
    throw new ProviderError("Polygon API key not configured", 503);
  }
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apiKey", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { next: { revalidate: 15 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(
      text.slice(0, 200) || `Polygon request failed (${res.status})`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

interface SnapshotTicker {
  ticker?: string;
  day?: { c?: number; o?: number; h?: number; l?: number; v?: number };
  prevDay?: { c?: number; o?: number; h?: number; l?: number; v?: number };
  min?: { c?: number; v?: number };
  lastTrade?: { p?: number; t?: number };
  updated?: number;
}

interface SnapshotResponse {
  status?: string;
  ticker?: SnapshotTicker;
}

interface AggsResult {
  results?: Array<{
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  }>;
  status?: string;
}

interface TickersSearchResult {
  results?: Array<{
    ticker?: string;
    name?: string;
    primary_exchange?: string;
    sic_code?: string;
    market_cap?: number;
  }>;
}

function mapSnapshotToQuote(symbol: string, snap: SnapshotTicker): Quote | null {
  const last =
    snap.lastTrade?.p ??
    snap.day?.c ??
    snap.min?.c ??
    snap.prevDay?.c;
  if (last === undefined || !Number.isFinite(last)) return null;
  const prevClose = snap.prevDay?.c ?? last;
  const change = last - prevClose;
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  const ts = snap.lastTrade?.t ?? snap.updated ?? Date.now();
  return {
    symbol,
    last,
    prevClose,
    change,
    changePct,
    open: snap.day?.o ?? prevClose,
    high: snap.day?.h ?? last,
    low: snap.day?.l ?? last,
    volume: snap.day?.v ?? snap.min?.v ?? 0,
    avgVolume: snap.prevDay?.v ?? 0,
    ts: ts > 1e12 ? ts : ts * 1000,
    stale: false,
  };
}

export async function fetchQuote(symbol: string): Promise<Quote | null> {
  const polygonSymbol = resolvePolygonTicker(symbol);
  const data = await polygonFetch<SnapshotResponse>(
    `/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(polygonSymbol)}`,
  );
  const snap = data.ticker;
  if (!snap) return null;
  return mapSnapshotToQuote(symbol, snap);
}

interface SnapshotAllResponse {
  tickers?: SnapshotTicker[];
}

/** One Polygon round-trip for many strip/index symbols. */
export async function fetchQuotesBulk(symbols: string[]): Promise<Quote[]> {
  const capped = symbols.slice(0, 20);
  const polygonToDisplay = new Map<string, string>();
  for (const sym of capped) {
    const poly = resolvePolygonTicker(sym);
    polygonToDisplay.set(poly, sym);
  }
  try {
    const data = await polygonFetch<SnapshotAllResponse>(
      "/v2/snapshot/locale/us/markets/stocks/tickers",
    );
    const quotes: Quote[] = [];
    for (const snap of data.tickers ?? []) {
      const poly = snap.ticker?.toUpperCase();
      if (!poly) continue;
      const display = polygonToDisplay.get(poly);
      if (!display) continue;
      const q = mapSnapshotToQuote(display, snap);
      if (q) quotes.push(q);
    }
    if (quotes.length > 0) return quotes;
  } catch {
    // fall through to per-symbol
  }
  return fetchQuotesPerSymbol(capped);
}

async function fetchQuotesPerSymbol(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.all(
    symbols.map(async (s) => {
      try {
        return await fetchQuote(s);
      } catch {
        return null;
      }
    }),
  );
  return results.filter((q): q is Quote => q !== null);
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const capped = symbols.slice(0, 20);
  if (capped.length > 3) {
    const bulk = await fetchQuotesBulk(capped);
    if (bulk.length > 0) return bulk;
  }
  return fetchQuotesPerSymbol(capped);
}

function intervalToRange(interval: CandleInterval): {
  mult: number;
  timespan: string;
  daysBack: number;
} {
  switch (interval) {
    case "1m":
      return { mult: 1, timespan: "minute", daysBack: 5 };
    case "5m":
      return { mult: 5, timespan: "minute", daysBack: 10 };
    case "15m":
      return { mult: 15, timespan: "minute", daysBack: 14 };
    case "1h":
      return { mult: 1, timespan: "hour", daysBack: 30 };
    case "1w":
      return { mult: 1, timespan: "week", daysBack: 365 * 3 };
    default:
      return { mult: 1, timespan: "day", daysBack: 365 };
  }
}

async function fetchCandlesForTicker(
  polygonTicker: string,
  interval: CandleInterval,
  opts: { from?: number; to?: number; limit?: number },
): Promise<Candle[]> {
  const { mult, timespan, daysBack } = intervalToRange(interval);
  const toMs = opts.to ? opts.to * 1000 : Date.now();
  const fromMs = opts.from ? opts.from * 1000 : toMs - daysBack * 86_400_000;
  const from = new Date(fromMs).toISOString().slice(0, 10);
  const to = new Date(toMs).toISOString().slice(0, 10);
  const limit = String(opts.limit ?? 500);
  const data = await polygonFetch<AggsResult>(
    `/v2/aggs/ticker/${encodeURIComponent(polygonTicker)}/range/${mult}/${timespan}/${from}/${to}`,
    { adjusted: "true", sort: "asc", limit },
  );
  const candles: Candle[] = (data.results ?? []).map((r) => ({
    t: Math.floor(r.t / 1000),
    o: r.o,
    h: r.h,
    l: r.l,
    c: r.c,
    v: r.v,
  }));
  if (opts.limit && candles.length > opts.limit) {
    return candles.slice(-opts.limit);
  }
  return candles;
}

export async function fetchCandles(
  symbol: string,
  interval: CandleInterval,
  opts: { from?: number; to?: number; limit?: number } = {},
): Promise<Candle[]> {
  const resolved = resolvePolygonTicker(symbol);
  return fetchCandlesForTicker(resolved, interval, opts);
}

function exchangeFromPrimary(ex?: string): Ticker["exchange"] {
  if (ex === "XNAS") return "NASDAQ";
  if (ex === "XNYS") return "NYSE";
  return "NASDAQ";
}

function sectorFromSic(sic?: string): Sector {
  if (!sic) return "Technology";
  const prefix = sic.slice(0, 4);
  return SIC_SECTOR[prefix] ?? "Technology";
}

export async function searchTickers(query: string, limit = 12): Promise<Ticker[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await polygonFetch<TickersSearchResult>("/v3/reference/tickers", {
    search: q,
    active: "true",
    limit: String(Math.min(limit, 50)),
  });
  return (data.results ?? [])
    .filter((r) => r.ticker)
    .map((r) => ({
      symbol: r.ticker!,
      name: r.name ?? r.ticker!,
      sector: sectorFromSic(r.sic_code),
      exchange: exchangeFromPrimary(r.primary_exchange),
      marketCap: r.market_cap,
    }));
}

export async function fetchTicker(symbol: string): Promise<Ticker | null> {
  const results = await searchTickers(symbol, 5);
  return results.find((t) => t.symbol === symbol) ?? results[0] ?? null;
}
