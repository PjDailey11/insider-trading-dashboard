import type {
  Ticker,
  Quote,
  Candle,
  CandleInterval,
  NewsItem,
  Politician,
  PoliticianTrade,
} from "@/lib/types";
import type {
  DataAdapter,
  ListResult,
  NewsFilter,
  PoliticianTradeFilter,
} from "./types";
import { mockAdapter } from "./mock";
import { buildQuery, fetchJson } from "./liveClient";

interface ListTradesResponse {
  items: PoliticianTrade[];
  nextCursor?: string;
}

interface ProfilesResponse {
  items: Politician[];
}

interface QuoteResponse {
  quote: Quote;
}

interface QuotesResponse {
  quotes: Quote[];
}

interface CandlesResponse {
  candles: Candle[];
  proxySymbol?: string;
  degraded?: boolean;
}

interface SearchTickersResponse {
  items: Ticker[];
}

function tradesQuery(filter: PoliticianTradeFilter): string {
  return buildQuery({
    symbol: filter.symbol,
    politicianId: filter.politicianId,
    cursor: filter.cursor,
    limit: filter.limit,
    since: filter.since,
    minAmount: filter.minAmount,
    side: filter.sides,
    role: filter.roles,
  });
}

export const liveAdapter: DataAdapter = {
  tickers: {
    async list() {
      const { items } = await fetchJson<SearchTickersResponse>(
        "/api/market/tickers/search?q=&limit=100",
      );
      return items;
    },
    async get(symbol) {
      const items = await fetchJson<SearchTickersResponse>(
        `/api/market/tickers/search${buildQuery({ q: symbol, limit: 5 })}`,
      );
      return items.items.find((t) => t.symbol === symbol) ?? null;
    },
    async search(query, limit = 12) {
      const { items } = await fetchJson<SearchTickersResponse>(
        `/api/market/tickers/search${buildQuery({ q: query, limit })}`,
      );
      return items;
    },
  },
  quotes: {
    async get(symbol) {
      const { quote } = await fetchJson<QuoteResponse>(
        `/api/market/quote${buildQuery({ symbol })}`,
      );
      return quote;
    },
    async batch(symbols) {
      const { quotes } = await fetchJson<QuotesResponse>(
        `/api/market/quotes${buildQuery({ symbols: symbols.join(",") })}`,
      );
      return quotes;
    },
  },
  candles: {
    async get(symbol, interval, opts = {}) {
      const res = await fetchJson<CandlesResponse>(
        `/api/market/candles${buildQuery({
          symbol,
          interval,
          limit: opts.limit,
          from: opts.from,
          to: opts.to,
        })}`,
      );
      return {
        candles: res.candles,
        proxySymbol: res.proxySymbol,
        degraded: res.degraded,
      };
    },
  },
  news: mockAdapter.news,
  politicians: {
    async list() {
      const { items } = await fetchJson<ProfilesResponse>("/api/insiders/profiles");
      return items;
    },
    async get(id) {
      const data = await fetchJson<{ profile: Politician }>(
        `/api/insiders/profiles/${encodeURIComponent(id)}`,
      );
      return data.profile;
    },
    async search(query, limit = 12) {
      const { items } = await fetchJson<ProfilesResponse>(
        `/api/insiders/profiles${buildQuery({ q: query, limit })}`,
      );
      return items;
    },
  },
  politicianTrades: {
    async list(filter = {}) {
      return fetchJson<ListResult<PoliticianTrade>>(
        `/api/insiders/trades${tradesQuery(filter)}`,
      );
    },
    async get(id) {
      const data = await fetchJson<{ trade: PoliticianTrade }>(
        `/api/insiders/trades/${encodeURIComponent(id)}`,
      );
      return data.trade;
    },
    async forSymbol(symbol, opts = {}) {
      const { items } = await fetchJson<ListTradesResponse>(
        `/api/insiders/trades${buildQuery({
          symbol,
          limit: opts.limit,
          since: opts.since,
        })}`,
      );
      return items;
    },
    async forPolitician(id, opts = {}) {
      const { items } = await fetchJson<ListTradesResponse>(
        `/api/insiders/trades${buildQuery({
          politicianId: id,
          limit: opts.limit,
        })}`,
      );
      return items;
    },
  },
};
