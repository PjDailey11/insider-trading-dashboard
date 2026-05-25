import type { Metadata } from "next";
import { SymbolWorkspace } from "@/components/views/SymbolWorkspace";

export interface SymbolPageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: SymbolPageProps): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} — Tickertape` };
}

export default async function SymbolPage({ params }: SymbolPageProps) {
  const { symbol } = await params;
  return <SymbolWorkspace symbol={symbol.toUpperCase()} />;
}
