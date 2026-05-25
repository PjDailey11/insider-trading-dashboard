import type { Metadata } from "next";
import { WatchlistsIndex } from "@/components/views/WatchlistsIndex";

export const metadata: Metadata = { title: "Watchlists — Tickertape" };

export default function WatchlistsPage() {
  return <WatchlistsIndex />;
}
