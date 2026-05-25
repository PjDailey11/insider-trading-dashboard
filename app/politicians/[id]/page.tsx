import type { Metadata } from "next";
import { PoliticianProfile } from "@/components/views/PoliticianProfile";

export interface PoliticianPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PoliticianPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Politician ${id} — Tickertape` };
}

export default async function PoliticianPage({ params }: PoliticianPageProps) {
  const { id } = await params;
  return <PoliticianProfile id={id} />;
}
