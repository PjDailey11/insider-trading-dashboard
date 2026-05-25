import type { Metadata } from "next";
import { WatchlistDetail } from "@/components/views/WatchlistDetail";

export const metadata: Metadata = { title: "Watchlist — Tickertape" };

export interface WatchlistPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const { id } = await params;
  return <WatchlistDetail id={id} />;
}
