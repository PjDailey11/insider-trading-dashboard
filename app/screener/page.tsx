import type { Metadata } from "next";
import { ScreenerView } from "@/components/views/ScreenerView";

export const metadata: Metadata = { title: "Screener — Tickertape" };

export default function ScreenerPage() {
  return <ScreenerView />;
}
