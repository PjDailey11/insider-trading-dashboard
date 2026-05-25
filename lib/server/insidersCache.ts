import type { Politician, PoliticianTrade } from "@/lib/types";
import type { PoliticianTradeFilter } from "@/lib/adapters/types";
import { searchInsiderFilings } from "./secApi";
import { flattenSecFilingsToTrades } from "@/lib/adapters/normalize/secToPoliticianTrade";
import { mergePoliticiansFromFilings } from "@/lib/adapters/normalize/secToPolitician";
import politiciansSeed from "@/seed/politicians.json";
import politicianTradesSeed from "@/seed/politicianTrades.json";

const politiciansMock = politiciansSeed as Politician[];
const tradesMock = politicianTradesSeed as PoliticianTrade[];

let cachedTrades: PoliticianTrade[] | null = null;
let cachedPoliticians: Politician[] | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadSecData(symbol?: string): Promise<{
  trades: PoliticianTrade[];
  politicians: Politician[];
}> {
  const now = Date.now();
  if (!symbol && cachedTrades && cachedPoliticians && now - cacheAt < CACHE_TTL_MS) {
    return { trades: cachedTrades, politicians: cachedPoliticians };
  }
  try {
    const res = await searchInsiderFilings({
      symbol,
      from: 0,
      size: 50,
    });
    const filings = res.transactions ?? [];
    const trades = flattenSecFilingsToTrades(filings);
    const politicians = mergePoliticiansFromFilings(filings);
    if (!symbol) {
      cachedTrades = trades;
      cachedPoliticians = politicians;
      cacheAt = now;
    }
    return { trades, politicians };
  } catch {
    return {
      trades: symbol
        ? tradesMock.filter((t) => t.symbol === symbol)
        : tradesMock.slice(0, 100),
      politicians: politiciansMock,
    };
  }
}

const BUCKET_ORDER = [
  "1k-15k",
  "15k-50k",
  "50k-100k",
  "100k-250k",
  "250k-500k",
  "500k-1m",
  "1m-5m",
  "5m-25m",
  "25m-50m",
  "50m+",
] as const;

function bucketIndex(b: PoliticianTrade["amountBucket"]): number {
  return BUCKET_ORDER.indexOf(b);
}

function filterTrades(
  trades: PoliticianTrade[],
  politicians: Politician[],
  filter: PoliticianTradeFilter,
): PoliticianTrade[] {
  const polById = new Map(politicians.map((p) => [p.id, p]));
  let result = trades.slice();
  if (filter.symbol) result = result.filter((t) => t.symbol === filter.symbol);
  if (filter.politicianId)
    result = result.filter((t) => t.politicianId === filter.politicianId);
  if (filter.sides?.length) {
    const set = new Set(filter.sides);
    result = result.filter((t) => set.has(t.side));
  }
  if (filter.since) result = result.filter((t) => t.tradeDate >= filter.since!);
  if (filter.minAmount) {
    const min = bucketIndex(filter.minAmount);
    result = result.filter((t) => bucketIndex(t.amountBucket) >= min);
  }
  if (filter.roles?.length) {
    const roles = filter.roles.map((r) => r.toLowerCase());
    result = result.filter((t) => {
      const p = polById.get(t.politicianId);
      if (!p) return false;
      return p.committees.some((c) =>
        roles.some((r) => c.toLowerCase().includes(r)),
      );
    });
  }
  return result;
}

export async function listInsiderTrades(
  filter: PoliticianTradeFilter = {},
): Promise<{ items: PoliticianTrade[]; nextCursor?: string }> {
  const { trades, politicians } = await loadSecData(filter.symbol);
  const filtered = filterTrades(trades, politicians, filter);
  const offset = filter.cursor ? Math.max(0, parseInt(filter.cursor, 10)) : 0;
  const limit = filter.limit ?? 30;
  const slice = filtered.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  return {
    items: slice,
    nextCursor: nextOffset < filtered.length ? String(nextOffset) : undefined,
  };
}

export async function getInsiderTrade(id: string): Promise<PoliticianTrade | null> {
  const { trades } = await loadSecData();
  return trades.find((t) => t.id === id) ?? null;
}

export async function listInsiderProfiles(): Promise<Politician[]> {
  const { politicians } = await loadSecData();
  return politicians;
}

export async function getInsiderProfile(id: string): Promise<Politician | null> {
  const { politicians } = await loadSecData();
  return politicians.find((p) => p.id === id) ?? null;
}

export async function searchInsiderProfiles(
  query: string,
  limit = 12,
): Promise<Politician[]> {
  const { politicians } = await loadSecData();
  const q = query.trim().toLowerCase();
  if (!q) return politicians.slice(0, limit);
  return politicians
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.state.toLowerCase() === q ||
        p.committees.some((c) => c.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

export async function tradesForSymbol(
  symbol: string,
  opts: { since?: number; limit?: number } = {},
): Promise<PoliticianTrade[]> {
  const { trades, politicians } = await loadSecData(symbol);
  let list = filterTrades(trades, politicians, { symbol });
  if (opts.since) list = list.filter((t) => t.tradeDate >= opts.since!);
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function tradesForPolitician(
  id: string,
  opts: { limit?: number } = {},
): Promise<PoliticianTrade[]> {
  const { trades, politicians } = await loadSecData();
  let list = filterTrades(trades, politicians, { politicianId: id });
  return opts.limit ? list.slice(0, opts.limit) : list;
}
