import type {
  Ticker,
  Quote,
  Candle,
  CandleInterval,
  NewsItem,
  Politician,
  PoliticianTrade,
  AmountBucket,
} from "@/lib/types";
import type {
  DataAdapter,
  ListResult,
  NewsFilter,
  PoliticianTradeFilter,
} from "./types";
import { simulateLatency } from "./mockLatency";

import tickersSeed from "@/seed/tickers.json";
import quotesSeed from "@/seed/quotes.json";
import newsSeed from "@/seed/news.json";
import politiciansSeed from "@/seed/politicians.json";
import politicianTradesSeed from "@/seed/politicianTrades.json";
import candlesDailySeed from "@/seed/candlesDaily.json";
import candlesIntradaySeed from "@/seed/candlesIntraday.json";

const tickers = tickersSeed as Ticker[];
const quotes = quotesSeed as Quote[];
const news = newsSeed as NewsItem[];
const politicians = politiciansSeed as Politician[];
const politicianTrades = politicianTradesSeed as PoliticianTrade[];
const candlesDaily = candlesDailySeed as Record<string, Candle[]>;
const candlesIntraday = candlesIntradaySeed as Record<string, Candle[]>;

const tickersBySymbol = new Map(tickers.map((t) => [t.symbol, t]));
const quotesBySymbol = new Map(quotes.map((q) => [q.symbol, q]));
const politiciansById = new Map(politicians.map((p) => [p.id, p]));
const tradesBySymbol = new Map<string, PoliticianTrade[]>();
const tradesByPolitician = new Map<string, PoliticianTrade[]>();
for (const t of politicianTrades) {
  const bySym = tradesBySymbol.get(t.symbol) ?? [];
  bySym.push(t);
  tradesBySymbol.set(t.symbol, bySym);
  const byPol = tradesByPolitician.get(t.politicianId) ?? [];
  byPol.push(t);
  tradesByPolitician.set(t.politicianId, byPol);
}

const BUCKET_ORDER: AmountBucket[] = [
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
];

function bucketIndex(b: AmountBucket): number {
  return BUCKET_ORDER.indexOf(b);
}

function paginate<T>(items: T[], cursor?: string, limit = 50): ListResult<T> {
  const offset = cursor ? Math.max(0, parseInt(cursor, 10)) : 0;
  const slice = items.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  return {
    items: slice,
    nextCursor: nextOffset < items.length ? String(nextOffset) : undefined,
  };
}

export const mockAdapter: DataAdapter = {
  tickers: {
    async list() {
      await simulateLatency();
      return tickers.slice();
    },
    async get(symbol) {
      await simulateLatency({ base: 40, jitter: 50 });
      return tickersBySymbol.get(symbol) ?? null;
    },
    async search(query, limit = 12) {
      await simulateLatency({ base: 30, jitter: 40 });
      const q = query.trim().toUpperCase();
      if (!q) return tickers.slice(0, limit);
      const exact = tickers.filter((t) => t.symbol === q);
      const startsWith = tickers.filter(
        (t) => t.symbol !== q && t.symbol.startsWith(q),
      );
      const nameMatch = tickers.filter(
        (t) =>
          !t.symbol.startsWith(q) &&
          (t.name.toUpperCase().includes(q) ||
            (t.industry?.toUpperCase().includes(q) ?? false)),
      );
      return [...exact, ...startsWith, ...nameMatch].slice(0, limit);
    },
  },
  quotes: {
    async get(symbol) {
      await simulateLatency({ base: 30, jitter: 50 });
      return quotesBySymbol.get(symbol) ?? null;
    },
    async batch(symbols) {
      await simulateLatency({ base: 60, jitter: 80 });
      return symbols
        .map((s) => quotesBySymbol.get(s))
        .filter((q): q is Quote => Boolean(q));
    },
  },
  candles: {
    async get(symbol, interval, opts = {}) {
      await simulateLatency({ base: 80, jitter: 120 });
      let candles: Candle[] = [];
      if (interval === "1d" || interval === "1w") {
        candles = candlesDaily[symbol] ?? [];
        if (interval === "1w") {
          // Aggregate 1d to 1w
          const weeks: Candle[] = [];
          for (let i = 0; i < candles.length; i += 5) {
            const slice = candles.slice(i, i + 5);
            if (slice.length === 0) continue;
            const first = slice[0]!;
            const last = slice[slice.length - 1]!;
            weeks.push({
              t: first.t,
              o: first.o,
              h: Math.max(...slice.map((c) => c.h)),
              l: Math.min(...slice.map((c) => c.l)),
              c: last.c,
              v: slice.reduce((s, c) => s + c.v, 0),
            });
          }
          candles = weeks;
        }
      } else {
        candles = candlesIntraday[symbol] ?? [];
      }
      let filtered = candles;
      if (opts.from) filtered = filtered.filter((c) => c.t >= opts.from!);
      if (opts.to) filtered = filtered.filter((c) => c.t <= opts.to!);
      if (opts.limit) filtered = filtered.slice(-opts.limit);
      return filtered;
    },
  },
  news: {
    async list(filter: NewsFilter = {}) {
      await simulateLatency({ base: 50, jitter: 80 });
      let result = news.slice();
      if (filter.symbols && filter.symbols.length > 0) {
        const set = new Set(filter.symbols);
        result = result.filter((n) => n.symbols.some((s) => set.has(s)));
      }
      if (filter.sentiments && filter.sentiments.length > 0) {
        const set = new Set(filter.sentiments);
        result = result.filter((n) => set.has(n.sentiment));
      }
      if (filter.isGlobal !== undefined) {
        result = result.filter((n) => Boolean(n.isGlobal) === filter.isGlobal);
      }
      if (filter.since) result = result.filter((n) => n.publishedAt >= filter.since!);
      return paginate(result, filter.cursor, filter.limit ?? 50);
    },
    async get(id) {
      await simulateLatency({ base: 30, jitter: 40 });
      return news.find((n) => n.id === id) ?? null;
    },
  },
  politicians: {
    async list() {
      await simulateLatency({ base: 50, jitter: 60 });
      return politicians.slice();
    },
    async get(id) {
      await simulateLatency({ base: 30, jitter: 40 });
      return politiciansById.get(id) ?? null;
    },
    async search(query, limit = 12) {
      await simulateLatency({ base: 30, jitter: 40 });
      const q = query.trim().toLowerCase();
      if (!q) return politicians.slice(0, limit);
      return politicians
        .filter((p) => p.name.toLowerCase().includes(q) || p.state.toLowerCase() === q)
        .slice(0, limit);
    },
  },
  politicianTrades: {
    async list(filter: PoliticianTradeFilter = {}) {
      await simulateLatency({ base: 80, jitter: 120 });
      let result = politicianTrades.slice();
      if (filter.symbol) result = result.filter((t) => t.symbol === filter.symbol);
      if (filter.politicianId)
        result = result.filter((t) => t.politicianId === filter.politicianId);
      if (filter.chambers && filter.chambers.length > 0) {
        const set = new Set(filter.chambers);
        result = result.filter((t) => {
          const p = politiciansById.get(t.politicianId);
          return p ? set.has(p.chamber) : false;
        });
      }
      if (filter.parties && filter.parties.length > 0) {
        const set = new Set(filter.parties);
        result = result.filter((t) => {
          const p = politiciansById.get(t.politicianId);
          return p ? set.has(p.party) : false;
        });
      }
      if (filter.states && filter.states.length > 0) {
        const set = new Set(filter.states);
        result = result.filter((t) => {
          const p = politiciansById.get(t.politicianId);
          return p ? set.has(p.state) : false;
        });
      }
      if (filter.owners && filter.owners.length > 0) {
        const set = new Set(filter.owners);
        result = result.filter((t) => set.has(t.owner));
      }
      if (filter.sides && filter.sides.length > 0) {
        const set = new Set(filter.sides);
        result = result.filter((t) => set.has(t.side));
      }
      if (filter.minAmount) {
        const min = bucketIndex(filter.minAmount);
        result = result.filter((t) => bucketIndex(t.amountBucket) >= min);
      }
      if (filter.since) result = result.filter((t) => t.tradeDate >= filter.since!);
      return paginate(result, filter.cursor, filter.limit ?? 30);
    },
    async get(id) {
      await simulateLatency({ base: 30, jitter: 40 });
      return politicianTrades.find((t) => t.id === id) ?? null;
    },
    async forSymbol(symbol, opts = {}) {
      await simulateLatency({ base: 40, jitter: 60 });
      let list = tradesBySymbol.get(symbol) ?? [];
      if (opts.since) list = list.filter((t) => t.tradeDate >= opts.since!);
      return opts.limit ? list.slice(0, opts.limit) : list.slice();
    },
    async forPolitician(id, opts = {}) {
      await simulateLatency({ base: 40, jitter: 60 });
      const list = tradesByPolitician.get(id) ?? [];
      return opts.limit ? list.slice(0, opts.limit) : list.slice();
    },
  },
};
