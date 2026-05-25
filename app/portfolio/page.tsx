import type { Metadata } from "next";
import { PortfolioView } from "@/components/views/PortfolioView";

export const metadata: Metadata = { title: "Portfolio — Tickertape" };

export default function PortfolioPage() {
  return <PortfolioView />;
}
