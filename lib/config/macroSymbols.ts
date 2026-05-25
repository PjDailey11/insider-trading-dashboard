/** Display symbols charted via ETF proxies on Polygon (mirrors STRIP_POLYGON_MAP). */
export const MACRO_PROXY_SYMBOLS = ["US02Y", "US10Y", "DXY", "NDX", "SPX"] as const;

export type MacroProxySymbol = (typeof MACRO_PROXY_SYMBOLS)[number];

/** Polygon / chart proxy ticker for each macro display symbol. */
export const MACRO_POLYGON_PROXY: Record<MacroProxySymbol, string> = {
  US02Y: "SHY",
  US10Y: "IEF",
  DXY: "UUP",
  NDX: "QQQ",
  SPX: "SPY",
};

export const MACRO_PROXY_LABELS: Record<MacroProxySymbol, string> = {
  US02Y: "2Y yield → SHY",
  US10Y: "10Y yield → IEF",
  DXY: "Dollar index → UUP",
  NDX: "Nasdaq-100 → QQQ",
  SPX: "S&P 500 → SPY",
};

export function macroPolygonProxy(symbol: string): string | undefined {
  const upper = symbol.trim().toUpperCase();
  if (!isMacroProxySymbol(upper)) return undefined;
  return MACRO_POLYGON_PROXY[upper];
}

export function isMacroProxySymbol(symbol: string): symbol is MacroProxySymbol {
  const upper = symbol.trim().toUpperCase();
  return (MACRO_PROXY_SYMBOLS as readonly string[]).includes(upper);
}

export function macroProxyLabel(symbol: string): string | undefined {
  const upper = symbol.trim().toUpperCase();
  if (!isMacroProxySymbol(upper)) return undefined;
  return MACRO_PROXY_LABELS[upper];
}
