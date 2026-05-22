import { NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySessionToken } from "@/lib/session-token";
import { maxGameScore } from "@/lib/scoring";
import { ITEMS, WAVES } from "@/game/content/dbir-2026";
import { getPostHogClient } from "@/lib/posthog-server";
import { previousDate } from "@/lib/daily";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const MIN_PLAYTIME_MS = 8_000;

// Derived from the content pack — the validation bounds.
const TOTAL_THREATS = WAVES.flatMap((w) => w.spawns).filter(
  (id) => ITEMS[id]?.isThreat,
).length;
const MAX_SCORE = maxGameScore(TOTAL_THREATS);

interface ScoreSubmission {
  token: string;
  score: number;
  accuracy: number;
  bestStreak: number;
  threatsStopped: number;
  wavesCleared: number;
  survived: boolean;
  displayName?: string;
}

function isInt(n: unknown, min: number, max: number): boolean {
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
}

/** Sanity bounds — a submitted score must be internally consistent. */
function plausible(s: ScoreSubmission): boolean {
  return (
    isInt(s.score, 0, MAX_SCORE) &&
    typeof s.accuracy === "number" && s.accuracy >= 0 && s.accuracy <= 1 &&
    isInt(s.bestStreak, 0, TOTAL_THREATS) &&
    isInt(s.threatsStopped, 0, TOTAL_THREATS) &&
    isInt(s.wavesCleared, 0, WAVES.length) &&
    typeof s.survived === "boolean" &&
    s.bestStreak <= s.threatsStopped
  );
}

/** POST /api/score — validate and record a completed game's score. */
export async function POST(req: Request) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ScoreSubmission;
  try {
    body = (await req.json()) as ScoreSubmission;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const payload = verifySessionToken(body.token ?? "");
  if (!payload || payload.pid !== userId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 403 });
  }

  const age = Date.now() - payload.iat;
  if (age < MIN_PLAYTIME_MS || age > TOKEN_TTL_MS) {
    return NextResponse.json({ error: "session_expired" }, { status: 403 });
  }

  if (!plausible(body)) {
    const ph = getPostHogClient();
    ph.capture({ distinctId: userId, event: "score_submission_rejected" });
    await ph.shutdown();
    return NextResponse.json({ error: "implausible_score" }, { status: 422 });
  }

  const admin = createAdminClient();
  const posthog = getPostHogClient();

  // select("*") so a missing challenge_date column (pre-M5 migration) can't
  // break score submission for solo play.
  const { data: session } = await admin
    .from("game_sessions")
    .select("*")
    .eq("id", payload.sid)
    .single();
  if (!session || session.player_id !== userId) {
    return NextResponse.json({ error: "unknown_session" }, { status: 404 });
  }
  if (session.status !== "active") {
    posthog.capture({
      distinctId: userId,
      event: "score_already_submitted",
      properties: { session_id: payload.sid },
    });
    await posthog.shutdown();
    return NextResponse.json({ error: "already_scored" }, { status: 409 });
  }

  const challengeDate: string | null = session.challenge_date ?? null;

  const insert = await admin.from("scores").insert({
    session_id: payload.sid,
    player_id: userId,
    score: body.score,
    accuracy: body.accuracy,
    best_streak: body.bestStreak,
    threats_stopped: body.threatsStopped,
    wave_reached: body.wavesCleared,
    survived: body.survived,
    display_name: body.displayName?.slice(0, 40) ?? null,
    challenge_date: challengeDate,
    validated: true,
  });
  if (insert.error) {
    return NextResponse.json({ error: "score_failed" }, { status: 500 });
  }

  await admin
    .from("game_sessions")
    .update({ status: "scored" })
    .eq("id", payload.sid);

  // Daily challenge: advance the player's day streak.
  let streak: number | undefined;
  if (challengeDate) {
    const { data: player } = await admin
      .from("players")
      .select("streak_count, last_played_date")
      .eq("id", userId)
      .single();
    const last: string | null = player?.last_played_date ?? null;
    if (last === challengeDate) {
      streak = player?.streak_count ?? 1;
    } else {
      streak = last === previousDate(challengeDate)
        ? (player?.streak_count ?? 0) + 1
        : 1;
      await admin
        .from("players")
        .update({ streak_count: streak, last_played_date: challengeDate })
        .eq("id", userId);
    }
  }

  const { count: higher } = await admin
    .from("scores")
    .select("id", { count: "exact", head: true })
    .gt("score", body.score);
  const { count: total } = await admin
    .from("scores")
    .select("id", { count: "exact", head: true });

  const rank = (higher ?? 0) + 1;
  const totalCount = total ?? 1;

  posthog.capture({
    distinctId: userId,
    event: "score_submitted",
    properties: {
      score: body.score,
      accuracy: body.accuracy,
      best_streak: body.bestStreak,
      threats_stopped: body.threatsStopped,
      waves_cleared: body.wavesCleared,
      survived: body.survived,
      daily: !!challengeDate,
      rank,
      total: totalCount,
    },
  });
  await posthog.shutdown();

  return NextResponse.json({ rank, total: totalCount, streak });
}
