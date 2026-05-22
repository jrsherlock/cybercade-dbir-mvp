import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/leaderboard — the global top scores. */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("leaderboard")
      .select(
        "rank, score, display_name, accuracy, best_streak, wave_reached, survived",
      )
      .order("rank", { ascending: true })
      .limit(25);
    if (error) return NextResponse.json({ entries: [] });
    return NextResponse.json({ entries: data ?? [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}
