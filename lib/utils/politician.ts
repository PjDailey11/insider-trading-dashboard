import type { Party, AmountBucket } from "@/lib/types";

export function partyLabel(party: Party): string {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  return "Independent";
}

export function partyVariant(party: Party): "dem" | "rep" | "ind" {
  if (party === "D") return "dem";
  if (party === "R") return "rep";
  return "ind";
}

const BUCKET_MIDPOINT: Record<AmountBucket, number> = {
  "1k-15k": 8_000,
  "15k-50k": 32_500,
  "50k-100k": 75_000,
  "100k-250k": 175_000,
  "250k-500k": 375_000,
  "500k-1m": 750_000,
  "1m-5m": 3_000_000,
  "5m-25m": 15_000_000,
  "25m-50m": 37_500_000,
  "50m+": 75_000_000,
};

export function bucketMidpoint(b: AmountBucket): number {
  return BUCKET_MIDPOINT[b];
}

export function bucketImportance(b: AmountBucket): 1 | 2 | 3 | 4 | 5 {
  const m = BUCKET_MIDPOINT[b];
  if (m >= 5_000_000) return 5;
  if (m >= 1_000_000) return 4;
  if (m >= 250_000) return 3;
  if (m >= 50_000) return 2;
  return 1;
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

/** Map a dollar value to the nearest official PTR amount bucket. */
export function valueToAmountBucket(valueUsd: number): AmountBucket {
  if (!Number.isFinite(valueUsd) || valueUsd <= 0) return "1k-15k";
  let best: AmountBucket = "1k-15k";
  let bestDist = Infinity;
  for (const b of BUCKET_ORDER) {
    const dist = Math.abs(BUCKET_MIDPOINT[b] - valueUsd);
    if (dist < bestDist) {
      bestDist = dist;
      best = b;
    }
  }
  return best;
}

export function bucketLabel(b: AmountBucket): string {
  const map: Record<AmountBucket, string> = {
    "1k-15k": "$1k–15k",
    "15k-50k": "$15k–50k",
    "50k-100k": "$50k–100k",
    "100k-250k": "$100k–250k",
    "250k-500k": "$250k–500k",
    "500k-1m": "$500k–1M",
    "1m-5m": "$1M–5M",
    "5m-25m": "$5M–25M",
    "25m-50m": "$25M–50M",
    "50m+": "$50M+",
  };
  return map[b];
}
