import type { Metadata } from "next";
import GameMount from "@/components/GameMount";

export const metadata: Metadata = {
  title: "Daily Challenge — Cybercade 2026-DBIR Edition",
};

export default function DailyPage() {
  return <GameMount mode="daily" />;
}
