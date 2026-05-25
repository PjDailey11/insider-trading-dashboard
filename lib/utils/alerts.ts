import type { AlertTrigger, AmountBucket } from "@/lib/types";
import { bucketLabel } from "./politician";

export function describeTrigger(t: AlertTrigger): string {
  switch (t.kind) {
    case "priceCross":
      return `${t.symbol} ${t.direction === "above" ? "crosses above" : "drops below"} $${t.threshold.toFixed(2)}`;
    case "percentMove":
      return `${t.symbol} moves ${t.percent > 0 ? "+" : ""}${t.percent}% within ${t.window}`;
    case "volumeSpike":
      return `${t.symbol} volume ≥ ${t.multiple.toFixed(1)}× average`;
    case "rsiCross":
      return `${t.symbol} RSI ${t.direction === "above" ? "above" : "below"} ${t.level}`;
    case "newsKeyword":
      return `News mentions ${t.keywords.map((k) => `“${k}”`).join(", ")}${t.symbol ? ` for ${t.symbol}` : " (any symbol)"}`;
    case "politicianTrade": {
      const parts: string[] = ["Politician"];
      if (t.side && t.side !== "any") parts.push(t.side);
      else parts.push("trade");
      if (t.symbol) parts.push(`in ${t.symbol}`);
      if (t.minAmount) parts.push(`≥ ${bucketLabel(t.minAmount as AmountBucket)}`);
      if (t.politicianId) parts.push(`by ${t.politicianId.slice(0, 8)}…`);
      return parts.join(" ");
    }
  }
}
