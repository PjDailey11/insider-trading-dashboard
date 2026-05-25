import type { Metadata } from "next";
import { AlertsCenter } from "@/components/views/AlertsCenter";

export const metadata: Metadata = { title: "Alerts — Tickertape" };

export default function AlertsPage() {
  return <AlertsCenter />;
}
