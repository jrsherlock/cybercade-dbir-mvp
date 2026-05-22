import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getRequestUserId } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { signSessionToken } from "@/lib/session-token";
import { getPostHogClient } from "@/lib/posthog-server";

/** POST /api/session — start a play session, return a signed anti-cheat token. */
export async function POST(req: Request) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const seed = randomUUID();
  const { data, error } = await admin
    .from("game_sessions")
    .insert({ player_id: userId, mode: "solo", seed, content_version: "dbir-2026" })
    .select("id")
    .single();
  if (error || !data) {
    posthog.capture({
      distinctId: userId,
      event: "session_creation_failed",
      properties: { reason: "session_failed" },
    });
    await posthog.shutdown();
    return NextResponse.json({ error: "session_failed" }, { status: 500 });
  }

  posthog.capture({
    distinctId: userId,
    event: "session_created",
    properties: { session_id: data.id },
  });
  await posthog.shutdown();

  const token = signSessionToken({ sid: data.id, pid: userId, iat: Date.now() });
  return NextResponse.json({ token, seed });
}
