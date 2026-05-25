import type { Candle, CandleInterval, Quote, Sector, Ticker } from "@/lib/types";
import tickersSeed from "@/seed/tickers.json";
import {
  INDEX_ETF_FALLBACK,
  resolveInstrument,
  type InstrumentType,
  type ResolvedInstrument,
} from "./instrumentMap";
import { getPublicAccountId, getPublicApiKey } from "./env";

export { resolveInstrumentApiSymbol } from "./instrumentMap";

const BASE = "https://api.public.com";
const TOKEN_TTL_MS = 55 * 60 * 1000;

const seedTickers = tickersSeed as Ticker[];

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly provider = "public",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }
  const secret = getPublicApiKey();
  if (!secret) {
    throw new ProviderError("Public API key not configured", 503);
  }
  const res = await fetch(`${BASE}/userapiauthservice/personal/access-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, validityInMinutes: 55 }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(
      text.slice(0, 200) || `Public auth failed (${res.status})`,
      res.status,
    );
  }
  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) {
    throw new ProviderError("Public auth response missing accessToken", 502);
  }
  tokenCache = { accessToken: data.accessToken, expiresAt: now + TOKEN_TTL_MS };
  return data.accessToken;
}

async function publicFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const { json, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(
      text.slice(0, 200) || `Public request failed (${res.status})`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

interface PublicInstrument {
  symbol?: string;
  type?: string;
}

interface PublicQuoteRow {
  instrument?: PublicInstrument;
  outcome?: string;
  last?: string;
  lastTimestamp?: string;
  bid?: string;
  ask?: string;
  volume?: number;
  previousClose?: string;
  oneDayChange?: { change?: string; percentChange?: string };
}

interface PublicQuotesResponse {
  quotes?: PublicQuoteRow[];
}

interface PublicBar {
  timestamp?: string;
  open?: string;
  close?: string;
  high?: string;
  low?: string;
  volume?: number;
}

interface PublicBarsResponse {
  regularMarket?: { bars?: PublicBar[] };
  preMarket?: { bars?: PublicBar[] };
  afterMarket?: { bars?: PublicBar[] };
}

function parseNum(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseTs(iso?: string): number {
  if (!iso) return Date.now();
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Date.now();
}

function mapQuoteRow(displaySymbol: string, row: PublicQuoteRow): Quote | null {
  if (row.outcome && row.outcome !== "SUCCESS") return null;
  const last = parseNum(row.last);
  if (last === undefined) return null;
  const prevClose = parseNum(row.previousClose) ?? last;
  const change = parseNum(row.oneDayChange?.change) ?? last - prevClose;
  const changePct =
    parseNum(row.oneDayChange?.percentChange) ??
    (prevClose !== 0 ? (change / prevClose) * 100 : 0);
  return {
    symbol: displaySymbol,
    last,
    prevClose,
    change,
    changePct,
    open: last,
    high: last,
    low: last,
    volume: row.volume ?? 0,
    avgVolume: 0,
    bid: parseNum(row.bid),
    ask: parseNum(row.ask),
    ts: parseTs(row.lastTimestamp),
    stale: false,
  };
}

async function fetchQuotesForInstruments(
  displayByKey: Map<string, string>,
  instruments: Array<{ symbol: string; type: InstrumentType }>,
): Promise<Quote[]> {
  const accountId = getPublicAccountId();
  if (!accountId) {
    throw new ProviderError("PUBLIC_ACCOUNT_ID not configured", 503);
  }
  const data = await publicFetch<PublicQuotesResponse>(
    `/userapigateway/marketdata/${encodeURIComponent(accountId)}/quotes`,
    {
      method: "POST",
      json: { instruments },
    },
  );
  const quotes: Quote[] = [];
  for (const row of data.quotes ?? []) {
    const sym = row.instrument?.symbol?.toUpperCase();
    const type = row.instrument?.type as InstrumentType | undefined;
    if (!sym || !type) continue;
    const key = `${sym}:${type}`;
    const display = displayByKey.get(key);
    if (!display) continue;
    const q = mapQuoteRow(display, row);
    if (q) quotes.push(q);
  }
  return quotes;
}

function instrumentKey(inst: ResolvedInstrument): string {
  return `${inst.symbol}:${inst.type}`;
}

async function fetchQuoteForInstrument(
  displaySymbol: string,
  inst: ResolvedInstrument,
): Promise<Quote | null> {
  const displayByKey = new Map<string, string>();
  displayByKey.set(instrumentKey(inst), displaySymbol);
  const quotes = await fetchQuotesForInstruments(displayByKey, [
    { symbol: inst.symbol, type: inst.type },
  ]);
  return quotes[0] ?? null;
}

export async function fetchQuote(symbol: string): Promise<Quote | null> {
  const primary = resolveInstrument(symbol);
  let quote = await fetchQuoteForInstrument(symbol, primary);
  if (quote) return quote;

  if (primary.type === "INDEX") {
    const etf = INDEX_ETF_FALLBACK[primary.symbol];
    if (etf) {
      quote = await fetchQuoteForInstrument(symbol, {
        symbol: etf,
        type: "EQUITY",
        proxyOf: symbol,
      });
      if (quote) return quote;
    }
  }
  return null;
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const capped = symbols.slice(0, 20);
  const displayByKey = new Map<string, string>();
  const instruments: Array<{ symbol: string; type: InstrumentType }> = [];
  const seen = new Set<string>();

  for (const sym of capped) {
    const inst = resolveInstrument(sym);
    const key = instrumentKey(inst);
    if (!seen.has(key)) {
      seen.add(key);
      instruments.push({ symbol: inst.symbol, type: inst.type });
      displayByKey.set(key, sym);
    }
  }

  const quotes = await fetchQuotesForInstruments(displayByKey, instruments);
  const got = new Set(quotes.map((q) => q.symbol));
  const missing = capped.filter((s) => !got.has(s));

  for (const sym of missing) {
    const inst = resolveInstrument(sym);
    if (inst.type !== "INDEX") continue;
    const etf = INDEX_ETF_FALLBACK[inst.symbol];
    if (!etf) continue;
    try {
      const q = await fetchQuoteForInstrument(sym, {
        symbol: etf,
        type: "EQUITY",
        proxyOf: sym,
      });
      if (q) quotes.push(q);
    } catch {
      // per-symbol fallback best-effort
    }
  }

  return quotes;
}

function intervalToPeriod(interval: CandleInterval): string | null {
  switch (interval) {
    case "1d":
      return "DAY";
    case "1w":
      return "WEEK";
    case "1m":
    case "5m":
    case "15m":
    case "1h":
      return null;
    default:
      return "DAY";
  }
}

function mapBars(rows: PublicBar[]): Candle[] {
  const candles: Candle[] = [];
  for (const bar of rows) {
    const close = parseNum(bar.close);
    const open = parseNum(bar.open) ?? close;
    const high = parseNum(bar.high) ?? close;
    const low = parseNum(bar.low) ?? close;
    if (close === undefined) continue;
    const ts = parseTs(bar.timestamp);
    candles.push({
      t: Math.floor(ts / 1000),
      o: open ?? close,
      h: high ?? close,
      l: low ?? close,
      c: close,
      v: bar.volume ?? 0,
    });
  }
  candles.sort((a, b) => a.t - b.t);
  return candles;
}

async function fetchCandlesForInstrument(
  inst: ResolvedInstrument,
  period: string,
  opts: { limit?: number },
): Promise<Candle[]> {
  const data = await publicFetch<PublicBarsResponse>(
    `/userapigateway/historicdata/${inst.type}/${encodeURIComponent(inst.symbol)}/${period}`,
    { method: "GET" },
  );
  const rows = [
    ...(data.preMarket?.bars ?? []),
    ...(data.regularMarket?.bars ?? []),
    ...(data.afterMarket?.bars ?? []),
  ];
  let candles = mapBars(rows);
  if (opts.limit && candles.length > opts.limit) {
    candles = candles.slice(-opts.limit);
  }
  return candles;
}

export async function fetchCandles(
  symbol: string,
  interval: CandleInterval,
  opts: { from?: number; to?: number; limit?: number } = {},
): Promise<Candle[]> {
  const period = intervalToPeriod(interval);
  if (!period) return [];

  const primary = resolveInstrument(symbol);
  let candles = await fetchCandlesForInstrument(primary, period, opts);
  if (candles.length > 0) return candles;

  if (primary.type === "INDEX") {
    const etf = INDEX_ETF_FALLBACK[primary.symbol];
    if (etf) {
      candles = await fetchCandlesForInstrument(
        { symbol: etf, type: "EQUITY", proxyOf: symbol },
        period,
        opts,
      );
    }
  }
  return candles;
}

function sectorFromSymbol(symbol: string): Sector {
  const upper = symbol.toUpperCase();
  if (["BTC", "ETH"].includes(upper)) return "Crypto";
  if (["SPX", "NDX", "DJI", "RUT", "VIX"].includes(upper)) return "Index";
  if (["US02Y", "US10Y", "DXY", "GOLD", "WTI"].includes(upper)) return "Macro";
  return "Technology";
}

function exchangeFromSymbol(symbol: string): Ticker["exchange"] {
  const upper = symbol.toUpperCase();
  if (["BTC", "ETH"].includes(upper)) return "CRYPTO";
  if (["SPX", "NDX", "DJI", "RUT", "VIX"].includes(upper)) return "INDEX";
  return "NASDAQ";
}

export async function searchTickers(query: string, limit = 12): Promise<Ticker[]> {
  const q = query.trim().toUpperCase();
  return seedTickers
    .filter(
      (t) =>
        !q ||
        t.symbol.toUpperCase().startsWith(q) ||
        t.name.toUpperCase().includes(q),
    )
    .slice(0, Math.min(limit, 50))
    .map((t) => ({
      ...t,
      sector: sectorFromSymbol(t.symbol),
      exchange: exchangeFromSymbol(t.symbol),
    }));
}

export async function fetchTicker(symbol: string): Promise<Ticker | null> {
  const upper = symbol.trim().toUpperCase();
  const direct = seedTickers.find((t) => t.symbol.toUpperCase() === upper);
  if (direct) return direct;
  const results = await searchTickers(symbol, 5);
  return results.find((t) => t.symbol.toUpperCase() === upper) ?? results[0] ?? null;
}
