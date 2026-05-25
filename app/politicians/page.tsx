import type { Metadata } from "next";
import { Suspense } from "react";
import { PoliticiansFeed } from "@/components/views/PoliticiansFeed";

export const metadata: Metadata = { title: "Politicians — Tickertape" };

export default function PoliticiansPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-text-muted">Loading…</div>}>
      <PoliticiansFeed />
    </Suspense>
  );
}
