import type { Metadata } from "next";
import { DashboardHome } from "@/components/views/DashboardHome";

export const metadata: Metadata = {
  title: "Dashboard — Tickertape",
};

export default function DashboardPage() {
  return <DashboardHome />;
}
