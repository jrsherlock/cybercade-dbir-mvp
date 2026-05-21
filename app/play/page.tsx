import type { Metadata } from "next";
import GameMount from "@/components/GameMount";

export const metadata: Metadata = {
  title: "Play — Cybercade 2026-DBIR Edition",
};

export default function PlayPage() {
  return <GameMount />;
}
