import type { PoliticianTrade, TradeSide } from "@/lib/types";
import type {
  SecFiling,
  SecNonDerivativeTransaction,
} from "@/lib/server/secApi";
import { valueToAmountBucket } from "@/lib/utils/politician";
import { insiderIdFromCik } from "./secToPolitician";

function parseDateMs(value: string | undefined): number {
  if (!value) return Date.now();
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : Date.now();
}

function lagDays(tradeMs: number, filedMs: number): number {
  const diff = Math.max(0, filedMs - tradeMs);
  return Math.floor(diff / 86_400_000);
}

function sideFromCode(code: string | undefined, adCode: string | undefined): TradeSide {
  const ad = (adCode ?? "").toUpperCase();
  if (ad === "A") return "buy";
  if (ad === "D") return "sell";
  const c = (code ?? "").toUpperCase();
  if (c === "P" || c === "A") return "buy";
  if (c === "S" || c === "D") return "sell";
  if (c === "E") return "exchange";
  if (c === "G") return "receive";
  return "buy";
}

function tradeId(filing: SecFiling, tx: SecNonDerivativeTransaction, index: number): string {
  const base = filing.accessionNo ?? filing.id ?? "sec";
  const date = tx.transactionDate ?? filing.filedAt ?? String(index);
  return `${base}_${date}_${index}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function secTransactionToTrade(
  filing: SecFiling,
  tx: SecNonDerivativeTransaction,
  index: number,
): PoliticianTrade | null {
  const symbol = filing.issuer?.tradingSymbol?.toUpperCase();
  const cik = filing.reportingOwner?.cik;
  if (!symbol || !cik) return null;
  const shares = tx.amounts?.shares ?? 0;
  const price = tx.amounts?.pricePerShare ?? 0;
  if (shares <= 0 && price <= 0) return null;
  const valueUsd = shares * price;
  const tradeDate = parseDateMs(tx.transactionDate ?? filing.periodOfReport);
  const disclosureDate = parseDateMs(filing.filedAt);
  return {
    id: tradeId(filing, tx, index),
    politicianId: insiderIdFromCik(cik),
    symbol,
    side: sideFromCode(tx.transactionCode, tx.amounts?.acquiredDisposedCode),
    owner: "self",
    amountBucket: valueToAmountBucket(valueUsd),
    tradeDate,
    disclosureDate,
    lagDays: lagDays(tradeDate, disclosureDate),
    assetType: "stock",
  };
}

export function flattenSecFilingsToTrades(filings: SecFiling[]): PoliticianTrade[] {
  const trades: PoliticianTrade[] = [];
  for (const filing of filings) {
    const txs = filing.nonDerivativeTable?.transactions ?? [];
    txs.forEach((tx, i) => {
      const t = secTransactionToTrade(filing, tx, i);
      if (t) trades.push(t);
    });
  }
  return trades.sort((a, b) => b.tradeDate - a.tradeDate);
}
