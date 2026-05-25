import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  Ticker,
  Quote,
  Candle,
  NewsItem,
  Politician,
  PoliticianTrade,
  Watchlist,
  Position,
  Sector,
  AmountBucket,
  TradeSide,
  TradeOwner,
  Party,
  Chamber,
  NewsSentiment,
} from "../lib/types";

// ────────────────────────────────────────────────────────────────────────────
// Deterministic RNG (Mulberry32). Same seed = identical output forever.
// ────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 0x7e57c0de;
const rng = mulberry32(SEED);

const rand = (): number => rng();
const randRange = (min: number, max: number): number => min + rand() * (max - min);
const randInt = (min: number, max: number): number => Math.floor(randRange(min, max + 1));
const pick = <T,>(arr: readonly T[]): T => {
  const item = arr[Math.floor(rand() * arr.length)];
  if (item === undefined) throw new Error("pick from empty array");
  return item;
};
const pickN = <T,>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy[idx]!);
    copy.splice(idx, 1);
  }
  return out;
};
const id = (() => {
  let n = 0;
  return (prefix: string): string =>
    `${prefix}_${(++n).toString(36).padStart(5, "0")}`;
})();

// ────────────────────────────────────────────────────────────────────────────
// Tickers — ~120 across sectors + indices + crypto + macro
// ────────────────────────────────────────────────────────────────────────────

interface TickerSpec {
  symbol: string;
  name: string;
  sector: Sector;
  exchange: Ticker["exchange"];
  basePrice: number;
  marketCap?: number;
  industry?: string;
}

const TICKER_SPECS: TickerSpec[] = [
  // Mega-cap tech
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 195, marketCap: 3_000_000_000_000, industry: "Consumer Electronics" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", exchange: "NASDAQ", basePrice: 425, marketCap: 3_100_000_000_000, industry: "Software" },
  { symbol: "GOOGL", name: "Alphabet Inc. Class A", sector: "Communication", exchange: "NASDAQ", basePrice: 175, marketCap: 2_200_000_000_000, industry: "Internet Services" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", exchange: "NASDAQ", basePrice: 198, marketCap: 2_100_000_000_000, industry: "E-Commerce" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Communication", exchange: "NASDAQ", basePrice: 555, marketCap: 1_400_000_000_000, industry: "Social Media" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 138, marketCap: 3_400_000_000_000, industry: "GPUs" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer", exchange: "NASDAQ", basePrice: 248, marketCap: 790_000_000_000, industry: "Electric Vehicles" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication", exchange: "NASDAQ", basePrice: 705, marketCap: 300_000_000_000, industry: "Streaming" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 510, marketCap: 230_000_000_000, industry: "Creative Software" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology", exchange: "NYSE", basePrice: 320, marketCap: 310_000_000_000, industry: "CRM" },
  { symbol: "ORCL", name: "Oracle Corp.", sector: "Technology", exchange: "NYSE", basePrice: 178, marketCap: 490_000_000_000, industry: "Database" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 170, marketCap: 790_000_000_000, industry: "Chips" },
  // Semis
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 142, marketCap: 230_000_000_000 },
  { symbol: "INTC", name: "Intel Corp.", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 22, marketCap: 95_000_000_000 },
  { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 162, marketCap: 180_000_000_000 },
  { symbol: "MU", name: "Micron Technology", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 102, marketCap: 113_000_000_000 },
  { symbol: "AMAT", name: "Applied Materials", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 178, marketCap: 148_000_000_000 },
  { symbol: "TSM", name: "Taiwan Semi", sector: "Semiconductors", exchange: "NYSE", basePrice: 190, marketCap: 980_000_000_000 },
  { symbol: "ASML", name: "ASML Holding", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 705, marketCap: 280_000_000_000 },
  { symbol: "MRVL", name: "Marvell Technology", sector: "Semiconductors", exchange: "NASDAQ", basePrice: 95, marketCap: 82_000_000_000 },
  // Financials
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", exchange: "NYSE", basePrice: 235, marketCap: 670_000_000_000 },
  { symbol: "BAC", name: "Bank of America", sector: "Financials", exchange: "NYSE", basePrice: 44, marketCap: 340_000_000_000 },
  { symbol: "WFC", name: "Wells Fargo", sector: "Financials", exchange: "NYSE", basePrice: 71, marketCap: 240_000_000_000 },
  { symbol: "GS", name: "Goldman Sachs", sector: "Financials", exchange: "NYSE", basePrice: 555, marketCap: 175_000_000_000 },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financials", exchange: "NYSE", basePrice: 128, marketCap: 207_000_000_000 },
  { symbol: "C", name: "Citigroup Inc.", sector: "Financials", exchange: "NYSE", basePrice: 72, marketCap: 137_000_000_000 },
  { symbol: "BLK", name: "BlackRock Inc.", sector: "Financials", exchange: "NYSE", basePrice: 1010, marketCap: 150_000_000_000 },
  { symbol: "SCHW", name: "Charles Schwab", sector: "Financials", exchange: "NYSE", basePrice: 78, marketCap: 142_000_000_000 },
  { symbol: "AXP", name: "American Express", sector: "Financials", exchange: "NYSE", basePrice: 298, marketCap: 213_000_000_000 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", exchange: "NYSE", basePrice: 312, marketCap: 615_000_000_000 },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Financials", exchange: "NYSE", basePrice: 525, marketCap: 485_000_000_000 },
  // Energy
  { symbol: "XOM", name: "ExxonMobil Corp.", sector: "Energy", exchange: "NYSE", basePrice: 118, marketCap: 520_000_000_000 },
  { symbol: "CVX", name: "Chevron Corp.", sector: "Energy", exchange: "NYSE", basePrice: 160, marketCap: 295_000_000_000 },
  { symbol: "COP", name: "ConocoPhillips", sector: "Energy", exchange: "NYSE", basePrice: 108, marketCap: 130_000_000_000 },
  { symbol: "SLB", name: "Schlumberger", sector: "Energy", exchange: "NYSE", basePrice: 41, marketCap: 58_000_000_000 },
  { symbol: "EOG", name: "EOG Resources", sector: "Energy", exchange: "NYSE", basePrice: 122, marketCap: 70_000_000_000 },
  { symbol: "OXY", name: "Occidental Petroleum", sector: "Energy", exchange: "NYSE", basePrice: 48, marketCap: 45_000_000_000 },
  { symbol: "MPC", name: "Marathon Petroleum", sector: "Energy", exchange: "NYSE", basePrice: 155, marketCap: 51_000_000_000 },
  // Consumer
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer", exchange: "NYSE", basePrice: 91, marketCap: 730_000_000_000 },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer", exchange: "NASDAQ", basePrice: 935, marketCap: 412_000_000_000 },
  { symbol: "HD", name: "Home Depot Inc.", sector: "Consumer", exchange: "NYSE", basePrice: 412, marketCap: 408_000_000_000 },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer", exchange: "NYSE", basePrice: 77, marketCap: 115_000_000_000 },
  { symbol: "MCD", name: "McDonald's Corp.", sector: "Consumer", exchange: "NYSE", basePrice: 295, marketCap: 213_000_000_000 },
  { symbol: "SBUX", name: "Starbucks Corp.", sector: "Consumer", exchange: "NASDAQ", basePrice: 98, marketCap: 110_000_000_000 },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Communication", exchange: "NYSE", basePrice: 113, marketCap: 205_000_000_000 },
  { symbol: "TGT", name: "Target Corp.", sector: "Consumer", exchange: "NYSE", basePrice: 137, marketCap: 63_000_000_000 },
  { symbol: "LOW", name: "Lowe's Companies", sector: "Consumer", exchange: "NYSE", basePrice: 262, marketCap: 150_000_000_000 },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer", exchange: "NYSE", basePrice: 172, marketCap: 405_000_000_000 },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer", exchange: "NYSE", basePrice: 64, marketCap: 275_000_000_000 },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer", exchange: "NASDAQ", basePrice: 162, marketCap: 222_000_000_000 },
  // Healthcare
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", exchange: "NYSE", basePrice: 158, marketCap: 380_000_000_000 },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare", exchange: "NYSE", basePrice: 595, marketCap: 550_000_000_000 },
  { symbol: "LLY", name: "Eli Lilly & Co.", sector: "Healthcare", exchange: "NYSE", basePrice: 770, marketCap: 730_000_000_000 },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare", exchange: "NYSE", basePrice: 26, marketCap: 147_000_000_000 },
  { symbol: "MRK", name: "Merck & Co.", sector: "Healthcare", exchange: "NYSE", basePrice: 100, marketCap: 253_000_000_000 },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", exchange: "NYSE", basePrice: 175, marketCap: 310_000_000_000 },
  { symbol: "TMO", name: "Thermo Fisher Sci.", sector: "Healthcare", exchange: "NYSE", basePrice: 528, marketCap: 202_000_000_000 },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Healthcare", exchange: "NYSE", basePrice: 113, marketCap: 196_000_000_000 },
  { symbol: "DHR", name: "Danaher Corp.", sector: "Healthcare", exchange: "NYSE", basePrice: 235, marketCap: 173_000_000_000 },
  { symbol: "CVS", name: "CVS Health Corp.", sector: "Healthcare", exchange: "NYSE", basePrice: 56, marketCap: 70_000_000_000 },
  // Biotech
  { symbol: "AMGN", name: "Amgen Inc.", sector: "Biotech", exchange: "NASDAQ", basePrice: 312, marketCap: 168_000_000_000 },
  { symbol: "GILD", name: "Gilead Sciences", sector: "Biotech", exchange: "NASDAQ", basePrice: 93, marketCap: 116_000_000_000 },
  { symbol: "REGN", name: "Regeneron Pharma", sector: "Biotech", exchange: "NASDAQ", basePrice: 715, marketCap: 77_000_000_000 },
  { symbol: "VRTX", name: "Vertex Pharma", sector: "Biotech", exchange: "NASDAQ", basePrice: 480, marketCap: 124_000_000_000 },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Biotech", exchange: "NASDAQ", basePrice: 42, marketCap: 16_000_000_000 },
  { symbol: "BIIB", name: "Biogen Inc.", sector: "Biotech", exchange: "NASDAQ", basePrice: 168, marketCap: 24_000_000_000 },
  { symbol: "ILMN", name: "Illumina Inc.", sector: "Biotech", exchange: "NASDAQ", basePrice: 138, marketCap: 22_000_000_000 },
  // Communication
  { symbol: "T", name: "AT&T Inc.", sector: "Communication", exchange: "NYSE", basePrice: 22, marketCap: 158_000_000_000 },
  { symbol: "VZ", name: "Verizon Communications", sector: "Communication", exchange: "NYSE", basePrice: 42, marketCap: 176_000_000_000 },
  { symbol: "TMUS", name: "T-Mobile US", sector: "Communication", exchange: "NASDAQ", basePrice: 232, marketCap: 268_000_000_000 },
  { symbol: "CMCSA", name: "Comcast Corp.", sector: "Communication", exchange: "NASDAQ", basePrice: 40, marketCap: 156_000_000_000 },
  { symbol: "SPOT", name: "Spotify Technology", sector: "Communication", exchange: "NYSE", basePrice: 458, marketCap: 92_000_000_000 },
  { symbol: "SNAP", name: "Snap Inc.", sector: "Communication", exchange: "NYSE", basePrice: 11, marketCap: 18_000_000_000 },
  { symbol: "PINS", name: "Pinterest Inc.", sector: "Communication", exchange: "NYSE", basePrice: 30, marketCap: 20_000_000_000 },
  // Industrial
  { symbol: "BA", name: "Boeing Co.", sector: "Industrial", exchange: "NYSE", basePrice: 170, marketCap: 105_000_000_000 },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrial", exchange: "NYSE", basePrice: 388, marketCap: 188_000_000_000 },
  { symbol: "GE", name: "GE Aerospace", sector: "Industrial", exchange: "NYSE", basePrice: 200, marketCap: 215_000_000_000 },
  { symbol: "RTX", name: "RTX Corp.", sector: "Industrial", exchange: "NYSE", basePrice: 125, marketCap: 165_000_000_000 },
  { symbol: "LMT", name: "Lockheed Martin", sector: "Industrial", exchange: "NYSE", basePrice: 535, marketCap: 128_000_000_000 },
  { symbol: "NOC", name: "Northrop Grumman", sector: "Industrial", exchange: "NYSE", basePrice: 490, marketCap: 71_000_000_000 },
  { symbol: "GD", name: "General Dynamics", sector: "Industrial", exchange: "NYSE", basePrice: 290, marketCap: 78_000_000_000 },
  { symbol: "DE", name: "Deere & Co.", sector: "Industrial", exchange: "NYSE", basePrice: 430, marketCap: 119_000_000_000 },
  { symbol: "UPS", name: "United Parcel Service", sector: "Industrial", exchange: "NYSE", basePrice: 130, marketCap: 110_000_000_000 },
  { symbol: "FDX", name: "FedEx Corp.", sector: "Industrial", exchange: "NYSE", basePrice: 268, marketCap: 64_000_000_000 },
  // Utilities + Real estate + Materials
  { symbol: "NEE", name: "NextEra Energy", sector: "Utilities", exchange: "NYSE", basePrice: 73, marketCap: 152_000_000_000 },
  { symbol: "DUK", name: "Duke Energy", sector: "Utilities", exchange: "NYSE", basePrice: 116, marketCap: 90_000_000_000 },
  { symbol: "SO", name: "Southern Co.", sector: "Utilities", exchange: "NYSE", basePrice: 91, marketCap: 99_000_000_000 },
  { symbol: "AMT", name: "American Tower", sector: "RealEstate", exchange: "NYSE", basePrice: 195, marketCap: 91_000_000_000 },
  { symbol: "PLD", name: "Prologis Inc.", sector: "RealEstate", exchange: "NYSE", basePrice: 116, marketCap: 107_000_000_000 },
  { symbol: "LIN", name: "Linde plc", sector: "Materials", exchange: "NYSE", basePrice: 467, marketCap: 222_000_000_000 },
  { symbol: "FCX", name: "Freeport-McMoRan", sector: "Materials", exchange: "NYSE", basePrice: 47, marketCap: 67_000_000_000 },
  { symbol: "NEM", name: "Newmont Corp.", sector: "Materials", exchange: "NYSE", basePrice: 56, marketCap: 65_000_000_000 },
  // Other notable
  { symbol: "PLTR", name: "Palantir Tech.", sector: "Technology", exchange: "NYSE", basePrice: 65, marketCap: 145_000_000_000 },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Technology", exchange: "NYSE", basePrice: 167, marketCap: 56_000_000_000 },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", exchange: "NYSE", basePrice: 113, marketCap: 145_000_000_000 },
  { symbol: "UBER", name: "Uber Technologies", sector: "Technology", exchange: "NYSE", basePrice: 72, marketCap: 150_000_000_000 },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer", exchange: "NASDAQ", basePrice: 135, marketCap: 86_000_000_000 },
  { symbol: "COIN", name: "Coinbase Global", sector: "Financials", exchange: "NASDAQ", basePrice: 285, marketCap: 73_000_000_000 },
  { symbol: "SQ", name: "Block Inc.", sector: "Financials", exchange: "NYSE", basePrice: 92, marketCap: 57_000_000_000 },
  { symbol: "PYPL", name: "PayPal Holdings", sector: "Financials", exchange: "NASDAQ", basePrice: 86, marketCap: 85_000_000_000 },
  { symbol: "RBLX", name: "Roblox Corp.", sector: "Communication", exchange: "NYSE", basePrice: 54, marketCap: 35_000_000_000 },
  { symbol: "DASH", name: "DoorDash Inc.", sector: "Consumer", exchange: "NYSE", basePrice: 175, marketCap: 73_000_000_000 },
  { symbol: "CRWD", name: "CrowdStrike Holdings", sector: "Technology", exchange: "NASDAQ", basePrice: 348, marketCap: 86_000_000_000 },
  { symbol: "PANW", name: "Palo Alto Networks", sector: "Technology", exchange: "NASDAQ", basePrice: 397, marketCap: 129_000_000_000 },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Technology", exchange: "NYSE", basePrice: 1050, marketCap: 215_000_000_000 },
  { symbol: "DDOG", name: "Datadog Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 145, marketCap: 49_000_000_000 },
  { symbol: "NET", name: "Cloudflare Inc.", sector: "Technology", exchange: "NYSE", basePrice: 110, marketCap: 37_000_000_000 },
  { symbol: "MDB", name: "MongoDB Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 297, marketCap: 22_000_000_000 },
  { symbol: "ZS", name: "Zscaler Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 200, marketCap: 30_000_000_000 },
  { symbol: "TEAM", name: "Atlassian Corp.", sector: "Technology", exchange: "NASDAQ", basePrice: 235, marketCap: 62_000_000_000 },
  // Indices
  { symbol: "SPX", name: "S&P 500 Index", sector: "Index", exchange: "INDEX", basePrice: 5990 },
  { symbol: "NDX", name: "Nasdaq-100 Index", sector: "Index", exchange: "INDEX", basePrice: 21300 },
  { symbol: "DJI", name: "Dow Jones Industrial", sector: "Index", exchange: "INDEX", basePrice: 43800 },
  { symbol: "RUT", name: "Russell 2000 Index", sector: "Index", exchange: "INDEX", basePrice: 2410 },
  { symbol: "VIX", name: "CBOE Volatility Index", sector: "Index", exchange: "INDEX", basePrice: 15.2 },
  // Crypto
  { symbol: "BTC", name: "Bitcoin", sector: "Crypto", exchange: "CRYPTO", basePrice: 97500 },
  { symbol: "ETH", name: "Ethereum", sector: "Crypto", exchange: "CRYPTO", basePrice: 3450 },
  { symbol: "SOL", name: "Solana", sector: "Crypto", exchange: "CRYPTO", basePrice: 245 },
  // Macro
  { symbol: "US10Y", name: "US 10-Year Treasury Yield", sector: "Macro", exchange: "BOND", basePrice: 4.38 },
  { symbol: "US02Y", name: "US 2-Year Treasury Yield", sector: "Macro", exchange: "BOND", basePrice: 4.31 },
  { symbol: "DXY", name: "US Dollar Index", sector: "Macro", exchange: "FX", basePrice: 106.5 },
  { symbol: "GOLD", name: "Gold Spot", sector: "Materials", exchange: "FX", basePrice: 2685 },
  { symbol: "WTI", name: "WTI Crude Oil", sector: "Energy", exchange: "FX", basePrice: 71.4 },
];

const tickers: Ticker[] = TICKER_SPECS.map(({ basePrice: _basePrice, ...t }) => t);

// ────────────────────────────────────────────────────────────────────────────
// Quotes — current snapshot derived from base price + jitter
// ────────────────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-22T20:00:00Z").getTime();

function makeQuote(spec: TickerSpec): Quote {
  const vol = randRange(0.3, 3.2); // intraday volatility factor %
  const changePct = randRange(-vol, vol);
  const prevClose = spec.basePrice;
  const last = +(prevClose * (1 + changePct / 100)).toFixed(spec.basePrice < 10 ? 4 : 2);
  const change = +(last - prevClose).toFixed(spec.basePrice < 10 ? 4 : 2);
  const intradayRange = Math.abs(prevClose * randRange(0.005, 0.025));
  const open = +(prevClose + randRange(-intradayRange / 2, intradayRange / 2)).toFixed(2);
  const high = +Math.max(open, last, prevClose + intradayRange / 2).toFixed(2);
  const low = +Math.min(open, last, prevClose - intradayRange / 2).toFixed(2);
  const avgVolume = Math.floor(randRange(1_000_000, 90_000_000));
  const volume = Math.floor(avgVolume * randRange(0.4, 2.5));
  return {
    symbol: spec.symbol,
    last,
    prevClose,
    change,
    changePct: +changePct.toFixed(3),
    open,
    high,
    low,
    volume,
    avgVolume,
    bid: +(last - randRange(0.01, 0.05)).toFixed(2),
    ask: +(last + randRange(0.01, 0.05)).toFixed(2),
    spread: +(randRange(0.01, 0.08)).toFixed(2),
    ts: NOW,
  };
}

const quotes: Quote[] = TICKER_SPECS.map(makeQuote);

// ────────────────────────────────────────────────────────────────────────────
// Candles — 1d for last 2y (top 30) + 5m for last 5 sessions (top 10)
// ────────────────────────────────────────────────────────────────────────────

const TOP_30_SYMBOLS = TICKER_SPECS.slice()
  .filter((t) => t.exchange !== "BOND" && t.exchange !== "FX")
  .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
  .slice(0, 30)
  .map((t) => t.symbol);

const TOP_10_SYMBOLS = TOP_30_SYMBOLS.slice(0, 10);

const DAY_MS = 86_400_000;

function generateDailyCandles(spec: TickerSpec, days: number): Candle[] {
  const out: Candle[] = [];
  let price = spec.basePrice * randRange(0.55, 0.95); // start lower 2y ago
  const drift = randRange(-0.0003, 0.0009); // long-term daily drift
  const volSigma = randRange(0.012, 0.038);
  const startTs = Math.floor((NOW - days * DAY_MS) / 1000);
  for (let i = 0; i < days; i++) {
    const t = startTs + i * (DAY_MS / 1000);
    const shock = (rand() - 0.5) * volSigma * 2;
    const dayReturn = drift + shock;
    const open = price;
    const close = +(open * (1 + dayReturn)).toFixed(spec.basePrice < 10 ? 4 : 2);
    const range = Math.abs(open * randRange(0.005, 0.03));
    const high = +Math.max(open, close, open + range * randRange(0.2, 1)).toFixed(2);
    const low = +Math.min(open, close, open - range * randRange(0.2, 1)).toFixed(2);
    const v = Math.floor(randRange(0.5e6, 80e6));
    out.push({ t, o: +open.toFixed(2), h: high, l: low, c: close, v });
    price = close;
  }
  return out;
}

function generateIntradayCandles(spec: TickerSpec, sessions: number): Candle[] {
  // 5-minute candles, US session 9:30–16:00 ET = 6.5h = 78 bars per session
  const out: Candle[] = [];
  const barsPerSession = 78;
  let price = spec.basePrice * randRange(0.97, 1.02);
  for (let s = 0; s < sessions; s++) {
    // Sessions are NOW - (sessions - s) days, start at 13:30 UTC (9:30 ET)
    const sessionStart = NOW - (sessions - s) * DAY_MS;
    const sessionDate = new Date(sessionStart);
    sessionDate.setUTCHours(13, 30, 0, 0);
    const startSec = Math.floor(sessionDate.getTime() / 1000);
    for (let i = 0; i < barsPerSession; i++) {
      const t = startSec + i * 300;
      const shock = (rand() - 0.5) * 0.004;
      const open = price;
      const close = +(open * (1 + shock)).toFixed(2);
      const range = Math.abs(open * randRange(0.0005, 0.003));
      const high = +Math.max(open, close, open + range).toFixed(2);
      const low = +Math.min(open, close, open - range).toFixed(2);
      const v = Math.floor(randRange(50_000, 1_500_000));
      out.push({ t, o: +open.toFixed(2), h: high, l: low, c: close, v });
      price = close;
    }
  }
  return out;
}

const MACRO_CANDLE_SYMBOLS = ["US10Y", "US02Y", "DXY"] as const;

const dailyCandles: Record<string, Candle[]> = {};
const intradayCandles: Record<string, Candle[]> = {};
for (const spec of TICKER_SPECS) {
  if (TOP_30_SYMBOLS.includes(spec.symbol)) {
    dailyCandles[spec.symbol] = generateDailyCandles(spec, 730);
  }
  if (TOP_10_SYMBOLS.includes(spec.symbol)) {
    intradayCandles[spec.symbol] = generateIntradayCandles(spec, 5);
  }
}
for (const macroSymbol of MACRO_CANDLE_SYMBOLS) {
  const spec = TICKER_SPECS.find((t) => t.symbol === macroSymbol);
  if (spec) dailyCandles[macroSymbol] = generateDailyCandles(spec, 730);
}

// ────────────────────────────────────────────────────────────────────────────
// News — ~200 items, mix of symbol-specific and global
// ────────────────────────────────────────────────────────────────────────────

const NEWS_SOURCES = ["Bloomberg", "Reuters", "WSJ", "FT", "CNBC", "Barron's", "Axios", "The Information", "Semafor"];
const NEWS_HEADLINES_POS = [
  "beats Q earnings, raises guidance",
  "announces $20B share buyback",
  "secures key government contract",
  "wins major enterprise deal",
  "files patent on novel architecture",
  "expands into emerging markets",
  "reports record quarterly revenue",
  "partners with Big Tech on AI integration",
  "completes strategic acquisition",
  "delivers strong forward guidance",
];
const NEWS_HEADLINES_NEG = [
  "misses on revenue, shares slide",
  "downgraded by analyst on competition fears",
  "faces antitrust probe in EU",
  "delays product launch citing supply chain",
  "issues profit warning ahead of guidance",
  "settles class-action for $1.2B",
  "loses key executive amid restructure",
  "cuts workforce by 8%",
  "warns of softening demand in Q3",
  "reports widening operating losses",
];
const NEWS_HEADLINES_NEUTRAL = [
  "files 10-Q with SEC",
  "schedules investor day for next quarter",
  "appoints new chief financial officer",
  "completes routine regulatory filing",
  "issues dividend record date",
  "announces refinancing of credit facility",
  "begins beta of new feature set",
  "comments on industry working group",
];
const NEWS_HEADLINES_GLOBAL = [
  "Fed signals patience on rate cuts; markets digest",
  "10Y yield jumps as inflation print surprises",
  "Dollar strengthens against major currencies",
  "Oil rallies on OPEC+ output discipline",
  "Crypto extends rally; BTC above $97K",
  "Senate advances bipartisan tariff bill",
  "House committee schedules tech CEO testimony",
  "Treasury sells record 30Y at sticky yield",
  "ECB holds; eyes Q3 cut window",
  "BoJ widens YCC band; yen wobbles",
];

const news: NewsItem[] = [];
for (let i = 0; i < 200; i++) {
  const isGlobal = rand() < 0.18;
  const sentRoll = rand();
  const sentiment: NewsSentiment =
    sentRoll < 0.42 ? "bullish" : sentRoll < 0.76 ? "neutral" : "bearish";
  if (isGlobal) {
    news.push({
      id: id("news"),
      headline: pick(NEWS_HEADLINES_GLOBAL),
      source: pick(NEWS_SOURCES),
      url: "#",
      publishedAt: NOW - randInt(0, 14) * DAY_MS - randInt(0, 86400) * 1000,
      symbols: pickN(
        TICKER_SPECS.filter((t) => t.sector === "Index" || t.sector === "Macro").map((t) => t.symbol),
        randInt(1, 3),
      ),
      sentiment,
      isGlobal: true,
      summary: "Market-moving macro headline; check chart context and rates desk note.",
    });
  } else {
    const spec = pick(TICKER_SPECS.filter((t) => t.exchange !== "BOND" && t.exchange !== "FX"));
    const corpus =
      sentiment === "bullish"
        ? NEWS_HEADLINES_POS
        : sentiment === "bearish"
          ? NEWS_HEADLINES_NEG
          : NEWS_HEADLINES_NEUTRAL;
    news.push({
      id: id("news"),
      headline: `${spec.symbol} ${pick(corpus)}`,
      source: pick(NEWS_SOURCES),
      url: "#",
      publishedAt: NOW - randInt(0, 21) * DAY_MS - randInt(0, 86400) * 1000,
      symbols: [spec.symbol],
      sentiment,
      summary: `${spec.name}: ${pick(corpus)}. Watch for follow-through on next session open.`,
    });
  }
}
news.sort((a, b) => b.publishedAt - a.publishedAt);

// ────────────────────────────────────────────────────────────────────────────
// Politicians (~60) + trades (~500)
// ────────────────────────────────────────────────────────────────────────────

const STATES = ["CA","NY","TX","FL","PA","IL","OH","GA","NC","MI","NJ","VA","WA","MA","AZ","TN","IN","MO","MD","WI","CO","MN","SC","AL","LA","KY","OR","OK","CT","UT","IA","NV","AR","MS","KS","NM","NE","WV","ID","HI","NH","ME","MT","RI","DE","SD","ND","AK","VT","WY"];
const COMMITTEES = [
  "Finance", "Banking", "Energy & Commerce", "Armed Services", "Foreign Relations",
  "Judiciary", "Intelligence", "Appropriations", "Budget", "Ways & Means",
  "Agriculture", "Health", "Transportation & Infrastructure", "Small Business", "Veterans Affairs",
  "Science, Space & Technology", "Homeland Security",
];
const FIRST_NAMES = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Margaret","Anthony","Betty","Donald","Sandra","Mark","Ashley","Paul","Kimberly","Steven","Emily","Andrew","Donna","Kenneth","Michelle","George","Carol","Joshua","Amanda","Kevin","Melissa","Brian","Deborah","Edward","Stephanie","Ronald","Rebecca","Timothy","Laura","Jason","Sharon","Jeffrey","Cynthia","Ryan","Kathleen","Jacob","Amy"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart"];

const politicians: Politician[] = [];
for (let i = 0; i < 60; i++) {
  const partyRoll = rand();
  const party: Party = partyRoll < 0.48 ? "D" : partyRoll < 0.94 ? "R" : "I";
  const chamber: Chamber = rand() < 0.62 ? "House" : "Senate";
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  politicians.push({
    id: id("pol"),
    name: `${first} ${last}`,
    party,
    chamber,
    state: pick(STATES),
    district: chamber === "House" ? `${randInt(1, 30)}` : undefined,
    committees: pickN(COMMITTEES, randInt(1, 4)),
    avatarSeed: `${first}-${last}-${i}`,
  });
}

const AMOUNT_BUCKETS: AmountBucket[] = [
  "1k-15k","15k-50k","50k-100k","100k-250k","250k-500k","500k-1m","1m-5m","5m-25m","25m-50m","50m+",
];

const polTrades: PoliticianTrade[] = [];
const tradeableSymbols = TICKER_SPECS.filter(
  (t) => t.exchange !== "BOND" && t.exchange !== "FX" && t.sector !== "Index",
);
for (let i = 0; i < 500; i++) {
  const politician = pick(politicians);
  const spec = pick(tradeableSymbols);
  const side: TradeSide = rand() < 0.55 ? "buy" : rand() < 0.92 ? "sell" : pick<TradeSide>(["exchange","receive"]);
  const ownerRoll = rand();
  const owner: TradeOwner =
    ownerRoll < 0.6 ? "self" : ownerRoll < 0.85 ? "spouse" : ownerRoll < 0.94 ? "joint" : pick<TradeOwner>(["child","dependent"]);
  const bucketRoll = rand();
  const bucket: AmountBucket =
    bucketRoll < 0.45
      ? "1k-15k"
      : bucketRoll < 0.7
        ? "15k-50k"
        : bucketRoll < 0.84
          ? "50k-100k"
          : bucketRoll < 0.92
            ? "100k-250k"
            : bucketRoll < 0.97
              ? "250k-500k"
              : bucketRoll < 0.99
                ? "500k-1m"
                : pick<AmountBucket>(["1m-5m", "5m-25m", "25m-50m", "50m+"]);
  const tradeDate = NOW - randInt(7, 720) * DAY_MS; // up to 2y back
  const lagDays = randInt(5, 45);
  const disclosureDate = tradeDate + lagDays * DAY_MS;
  polTrades.push({
    id: id("ptr"),
    politicianId: politician.id,
    symbol: spec.symbol,
    side,
    owner,
    amountBucket: bucket,
    tradeDate,
    disclosureDate,
    lagDays,
    assetType: rand() < 0.86 ? "stock" : rand() < 0.95 ? "option" : pick<PoliticianTrade["assetType"]>(["etf","bond","other"]),
    note: rand() < 0.05 ? "Periodic transaction report (PTR)" : undefined,
  });
}
polTrades.sort((a, b) => b.disclosureDate - a.disclosureDate);

// ────────────────────────────────────────────────────────────────────────────
// Watchlists + Positions
// ────────────────────────────────────────────────────────────────────────────

const watchlists: Watchlist[] = [
  {
    id: "wl_mega",
    name: "Mega Cap",
    symbols: ["AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","AVGO","BRK.B","JPM","UNH","V","WMT"].filter((s) => TICKER_SPECS.some((t) => t.symbol === s)),
    createdAt: NOW - 90 * DAY_MS,
    updatedAt: NOW - 1 * DAY_MS,
  },
  {
    id: "wl_macro",
    name: "Macro",
    symbols: ["SPX","NDX","DJI","RUT","VIX","BTC","ETH","US10Y","US02Y","DXY","GOLD","WTI"],
    createdAt: NOW - 60 * DAY_MS,
    updatedAt: NOW - 2 * DAY_MS,
  },
  {
    id: "wl_pol_heavy",
    name: "Politician-Heavy",
    symbols: (() => {
      const counts = new Map<string, number>();
      for (const t of polTrades) counts.set(t.symbol, (counts.get(t.symbol) ?? 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([s]) => s);
    })(),
    createdAt: NOW - 30 * DAY_MS,
    updatedAt: NOW - 3 * DAY_MS,
  },
];

const positionsSpecs: Array<[string, number, number]> = [
  ["AAPL", 50, 168.42],
  ["NVDA", 80, 108.15],
  ["MSFT", 25, 388.10],
  ["GOOGL", 60, 142.55],
  ["TSLA", 30, 215.80],
  ["AMD", 100, 124.30],
  ["SPY".replace("SPY", "SPX"), 0, 0], // placeholder filter
  ["JPM", 35, 198.40],
  ["XOM", 70, 102.10],
];
const positions: Position[] = positionsSpecs
  .filter(([_, qty]) => qty > 0)
  .map(([symbol, qty, avg], i) => ({
    id: `pos_${i + 1}`,
    symbol,
    quantity: qty,
    avgCost: avg,
    openedAt: NOW - randInt(45, 600) * DAY_MS,
  }));

// ────────────────────────────────────────────────────────────────────────────
// Write seed files
// ────────────────────────────────────────────────────────────────────────────

const root = process.cwd();
const seedDir = join(root, "seed");
if (!existsSync(seedDir)) mkdirSync(seedDir, { recursive: true });

function write(name: string, data: unknown): void {
  const p = join(seedDir, name);
  writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`  wrote ${name}`);
}

console.log(`Generating seed (deterministic, seed=${SEED.toString(16)})`);
write("tickers.json", tickers);
write("quotes.json", quotes);
write("candlesDaily.json", dailyCandles);
write("candlesIntraday.json", intradayCandles);
write("news.json", news);
write("politicians.json", politicians);
write("politicianTrades.json", polTrades);
write("watchlists.json", watchlists);
write("positions.json", positions);
console.log(`Done. ${tickers.length} tickers, ${news.length} news, ${politicians.length} politicians, ${polTrades.length} trades.`);
