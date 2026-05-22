import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getRequestUserId } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSessionToken } from "@/lib/session-token";
import { getPostHogClient } from "@/lib/posthog-server";
import { getOrCreateDailyChallenge } from "@/lib/daily";

/** POST /api/session — start a play session, return a signed anti-cheat token. */
export async function POST(req: Request) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let mode: "solo" | "daily" = "solo";
  try {
    const body = await req.json();
    if (body?.mode === "daily") mode = "daily";
  } catch {
    // no body — defaults to solo
  }

  const admin = createAdminClient();
  const posthog = getPostHogClient();

  const player = await admin
    .from("players")
    .upsert({ id: userId }, { onConflict: "id" });
  if (player.error) {
    posthog.capture({
      distinctId: userId,
      event: "session_creation_failed",
      properties: { reason: "player_failed" },
    });
    await posthog.shutdown();
    return NextResponse.json({ error: "player_failed" }, { status: 500 });
  }

  let seed: string;
  let challengeDate: string | null = null;
  if (mode === "daily") {
    const daily = await getOrCreateDailyChallenge(admin);
    seed = daily.seed;
    challengeDate = daily.date;
  } else {
    seed = randomUUID();
  }

  // challenge_date is only set for daily runs, so solo sessions still insert
  // cleanly even before the M5 migration adds that column.
  const sessionRow: Record<string, unknown> = {
    player_id: userId,
    mode,
    seed,
    content_version: "dbir-2026",
  };
  if (challengeDate) sessionRow.challenge_date = challengeDate;

  const { data, error } = await admin
    .from("game_sessions")
    .insert(sessionRow)
    .select("id")
    .single();
  if (error || !data) {
    posthog.capture({
      distinctId: userId,
      event: "session_creation_failed",
      properties: { reason: "session_failed", mode },
    });
    await posthog.shutdown();
    return NextResponse.json({ error: "session_failed" }, { status: 500 });
  }

  posthog.capture({
    distinctId: userId,
    event: "session_created",
    properties: { session_id: data.id, mode },
  });
  await posthog.shutdown();

  const token = signSessionToken({ sid: data.id, pid: userId, iat: Date.now() });
  return NextResponse.json({ token, seed, mode });
}
