// Core domain types for the trading dashboard.
// All adapters and stores conform to these shapes.

export type Sector =
  | "Technology"
  | "Financials"
  | "Energy"
  | "Consumer"
  | "Healthcare"
  | "Biotech"
  | "Semiconductors"
  | "Communication"
  | "Industrial"
  | "Utilities"
  | "Materials"
  | "RealEstate"
  | "Crypto"
  | "Index"
  | "Macro";

export interface Ticker {
  symbol: string;
  name: string;
  sector: Sector;
  exchange: "NASDAQ" | "NYSE" | "CRYPTO" | "INDEX" | "BOND" | "FX";
  marketCap?: number;
  industry?: string;
}

export interface Quote {
  symbol: string;
  last: number;
  prevClose: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  bid?: number;
  ask?: number;
  spread?: number;
  ts: number; // epoch ms
  stale?: boolean;
}

export interface Candle {
  t: number; // epoch seconds (lightweight-charts convention)
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "1d" | "1w";

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
  note?: string;
}

export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: number;
  symbols: string[];
  sentiment: NewsSentiment;
  summary?: string;
  isGlobal?: boolean;
}

export type AlertKind =
  | "priceCross"
  | "percentMove"
  | "volumeSpike"
  | "rsiCross"
  | "newsKeyword"
  | "politicianTrade";

export interface AlertTriggerBase {
  kind: AlertKind;
}

export interface PriceCrossTrigger extends AlertTriggerBase {
  kind: "priceCross";
  symbol: string;
  threshold: number;
  direction: "above" | "below";
}

export interface PercentMoveTrigger extends AlertTriggerBase {
  kind: "percentMove";
  symbol: string;
  percent: number;
  window: "1d" | "1w" | "1m";
}

export interface VolumeSpikeTrigger extends AlertTriggerBase {
  kind: "volumeSpike";
  symbol: string;
  multiple: number; // e.g. 3 = 3x avg volume
}

export interface RsiCrossTrigger extends AlertTriggerBase {
  kind: "rsiCross";
  symbol: string;
  level: number;
  direction: "above" | "below";
}

export interface NewsKeywordTrigger extends AlertTriggerBase {
  kind: "newsKeyword";
  symbol?: string;
  keywords: string[];
}

export interface PoliticianTradeTrigger extends AlertTriggerBase {
  kind: "politicianTrade";
  symbol?: string;
  politicianId?: string;
  minAmount?: AmountBucket;
  side?: "buy" | "sell" | "any";
}

export type AlertTrigger =
  | PriceCrossTrigger
  | PercentMoveTrigger
  | VolumeSpikeTrigger
  | RsiCrossTrigger
  | NewsKeywordTrigger
  | PoliticianTradeTrigger;

export type AlertStatus = "active" | "triggered" | "snoozed" | "archived";

export interface AlertEvent {
  ts: number;
  message: string;
  payload?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  name: string;
  trigger: AlertTrigger;
  status: AlertStatus;
  createdAt: number;
  updatedAt: number;
  lastTriggeredAt?: number;
  events: AlertEvent[];
  note?: string;
  snoozeUntil?: number;
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  openedAt: number;
  closedAt?: number;
  note?: string;
}

export type Party = "D" | "R" | "I";
export type Chamber = "House" | "Senate";
export type TradeSide = "buy" | "sell" | "exchange" | "receive";
export type TradeOwner = "self" | "spouse" | "child" | "joint" | "dependent";

// Official PTR amount buckets, exact thresholds from Stock Act / EFD spec
export type AmountBucket =
  | "1k-15k"
  | "15k-50k"
  | "50k-100k"
  | "100k-250k"
  | "250k-500k"
  | "500k-1m"
  | "1m-5m"
  | "5m-25m"
  | "25m-50m"
  | "50m+";

export interface Politician {
  id: string;
  name: string;
  party: Party;
  chamber: Chamber;
  state: string; // US 2-letter
  district?: string;
  committees: string[];
  avatarSeed: string;
}

export interface PoliticianTrade {
  id: string;
  politicianId: string;
  symbol: string;
  side: TradeSide;
  owner: TradeOwner;
  amountBucket: AmountBucket;
  tradeDate: number; // anchor — used for chart markers + alerts
  disclosureDate: number;
  lagDays: number;
  assetType: "stock" | "option" | "etf" | "bond" | "other";
  note?: string;
}

export type SignalKind =
  | "politicianBuy"
  | "politicianSell"
  | "newsBurst"
  | "volumeSpike"
  | "rsiOverbought"
  | "rsiOversold";

export interface SignalEvent {
  id: string;
  symbol: string;
  kind: SignalKind;
  ts: number;
  importance: 1 | 2 | 3 | 4 | 5;
  title: string;
  detail?: string;
  payload?: Record<string, unknown>;
}

export interface UserNote {
  id: string;
  symbol?: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface SectorPerf {
  sector: Sector;
  weight: number;
  changePct: number;
}

export interface ScreenerCriterion {
  field: string;
  op: "gt" | "lt" | "gte" | "lte" | "eq" | "between" | "in";
  value: number | number[] | string | string[];
}

export interface SavedScreen {
  id: string;
  name: string;
  criteria: ScreenerCriterion[];
  createdAt: number;
}

export interface PanelLayout {
  id: string;
  name: string;
  layout: unknown; // serialised react-resizable-panels structure
  createdAt: number;
}
