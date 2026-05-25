export type InstrumentType = "EQUITY" | "INDEX" | "CRYPTO";

export interface ResolvedInstrument {
  symbol: string;
  type: InstrumentType;
  /** Original display symbol when resolved via proxy mapping. */
  proxyOf?: string;
}

const INDEX_SYMBOLS = new Set(["SPX", "NDX", "DJI", "RUT", "VIX"]);

const CRYPTO_SYMBOLS = new Set(["BTC", "ETH"]);

/** Display symbols that always chart/quote via a proxy instrument on Public. */
export const STRIP_INSTRUMENT_MAP: Record<string, { symbol: string; type: InstrumentType }> = {
  US02Y: { symbol: "SHY", type: "EQUITY" },
  US10Y: { symbol: "IEF", type: "EQUITY" },
  DXY: { symbol: "UUP", type: "EQUITY" },
  GOLD: { symbol: "GLD", type: "EQUITY" },
  WTI: { symbol: "USO", type: "EQUITY" },
  BTC: { symbol: "BTC", type: "CRYPTO" },
  ETH: { symbol: "ETH", type: "CRYPTO" },
};

/** INDEX → ETF fallback when native index quotes/bars are empty. */
export const INDEX_ETF_FALLBACK: Record<string, string> = {
  SPX: "SPY",
  NDX: "QQQ",
  DJI: "DIA",
  RUT: "IWM",
  VIX: "VIXY",
};

export function resolveInstrument(displaySymbol: string): ResolvedInstrument {
  const upper = displaySymbol.trim().toUpperCase();
  const mapped = STRIP_INSTRUMENT_MAP[upper];
  if (mapped) {
    return { symbol: mapped.symbol, type: mapped.type, proxyOf: upper };
  }
  if (CRYPTO_SYMBOLS.has(upper)) {
    return { symbol: upper, type: "CRYPTO" };
  }
  if (INDEX_SYMBOLS.has(upper)) {
    return { symbol: upper, type: "INDEX" };
  }
  return { symbol: upper, type: "EQUITY" };
}

/** Symbol string used for historic/quote API paths (primary resolution). */
export function resolveInstrumentSymbol(displaySymbol: string): string {
  return resolveInstrument(displaySymbol).symbol;
}

/** @deprecated Alias for seed proxy lookup in API routes */
export const resolveInstrumentApiSymbol = resolveInstrumentSymbol;
