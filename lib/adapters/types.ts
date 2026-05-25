import type {
  Ticker,
  Quote,
  Candle,
  CandleInterval,
  NewsItem,
  PoliticianTrade,
  Politician,
} from "@/lib/types";

export interface ListResult<T> {
  items: T[];
  nextCursor?: string;
}

export interface TickersAdapter {
  list(): Promise<Ticker[]>;
  get(symbol: string): Promise<Ticker | null>;
  search(query: string, limit?: number): Promise<Ticker[]>;
}

export interface QuotesAdapter {
  get(symbol: string): Promise<Quote | null>;
  batch(symbols: string[]): Promise<Quote[]>;
  stream?(symbol: string): AsyncIterable<Quote>; // optional V2
}

export interface CandlesAdapter {
  get(
    symbol: string,
    interval: CandleInterval,
    opts?: { from?: number; to?: number; limit?: number },
  ): Promise<Candle[]>;
}

export interface NewsFilter {
  symbols?: string[];
  sentiments?: Array<"bullish" | "bearish" | "neutral">;
  isGlobal?: boolean;
  since?: number;
  limit?: number;
  cursor?: string;
}

export interface NewsAdapter {
  list(filter?: NewsFilter): Promise<ListResult<NewsItem>>;
  get(id: string): Promise<NewsItem | null>;
}

export interface PoliticianTradeFilter {
  symbol?: string;
  politicianId?: string;
  chambers?: Array<"House" | "Senate">;
  parties?: Array<"D" | "R" | "I">;
  states?: string[];
  owners?: Array<"self" | "spouse" | "child" | "joint" | "dependent">;
  minAmount?: import("@/lib/types").AmountBucket;
  sides?: Array<"buy" | "sell" | "exchange" | "receive">;
  since?: number;
  limit?: number;
  cursor?: string;
}

export interface PoliticianTradesAdapter {
  list(filter?: PoliticianTradeFilter): Promise<ListResult<PoliticianTrade>>;
  get(id: string): Promise<PoliticianTrade | null>;
  forSymbol(symbol: string, opts?: { since?: number; limit?: number }): Promise<PoliticianTrade[]>;
  forPolitician(id: string, opts?: { limit?: number }): Promise<PoliticianTrade[]>;
}

export interface PoliticiansAdapter {
  list(): Promise<Politician[]>;
  get(id: string): Promise<Politician | null>;
  search(query: string, limit?: number): Promise<Politician[]>;
}

export interface DataAdapter {
  tickers: TickersAdapter;
  quotes: QuotesAdapter;
  candles: CandlesAdapter;
  news: NewsAdapter;
  politicians: PoliticiansAdapter;
  politicianTrades: PoliticianTradesAdapter;
}
