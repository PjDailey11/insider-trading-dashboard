import { getSecApiKey } from "./env";

const ENDPOINT = "https://api.sec-api.io/insider-trading";

export class SecProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly provider = "sec-api",
  ) {
    super(message);
    this.name = "SecProviderError";
  }
}

export interface SecTransactionAmounts {
  shares?: number;
  pricePerShare?: number;
  acquiredDisposedCode?: string;
}

export interface SecNonDerivativeTransaction {
  transactionDate?: string;
  securityTitle?: string;
  transactionCode?: string;
  amounts?: SecTransactionAmounts;
}

export interface SecReportingOwner {
  cik?: string;
  name?: string;
  director?: boolean;
  officer?: boolean;
  officerTitle?: string;
  tenPercentOwner?: boolean;
  otherText?: string;
  address?: { state?: string; city?: string };
}

export interface SecIssuer {
  cik?: string;
  name?: string;
  tradingSymbol?: string;
}

export interface SecFiling {
  id?: string;
  accessionNo?: string;
  filedAt?: string;
  documentType?: string;
  periodOfReport?: string;
  reportingOwner?: SecReportingOwner;
  issuer?: SecIssuer;
  nonDerivativeTable?: {
    transactions?: SecNonDerivativeTransaction[];
  };
}

export interface SecInsiderResponse {
  total?: { value?: number; relation?: string };
  transactions?: SecFiling[];
}

export interface SecSearchParams {
  query?: string;
  from?: number;
  size?: number;
  symbol?: string;
}

const DEFAULT_QUERY =
  "documentType:4 AND nonDerivativeTable.transactions:*";

export async function searchInsiderFilings(
  params: SecSearchParams = {},
): Promise<SecInsiderResponse> {
  const apiKey = getSecApiKey();
  if (!apiKey) {
    throw new SecProviderError("SEC API key not configured", 503);
  }
  const from = params.from ?? 0;
  const size = Math.min(params.size ?? 50, 50);
  let query = params.query ?? DEFAULT_QUERY;
  if (params.symbol) {
    const sym = params.symbol.toUpperCase();
    query = `${query} AND issuer.tradingSymbol:${sym}`;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      from,
      size,
      sort: [{ filedAt: { order: "desc" } }],
    }),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SecProviderError(
      text.slice(0, 200) || `SEC API request failed (${res.status})`,
      res.status,
    );
  }
  return res.json() as Promise<SecInsiderResponse>;
}
