import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Today's date as YYYY-MM-DD (UTC). */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The calendar day before a YYYY-MM-DD date. */
export function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Today's daily-challenge seed — everyone who plays the daily on a given date
 * gets the same shuffle. The row is created lazily on the first request of the
 * day. Falls back to a deterministic seed if the table isn't reachable.
 */
export async function getOrCreateDailyChallenge(
  admin: SupabaseClient,
): Promise<{ date: string; seed: string }> {
  const date = todayDate();
  try {
    const existing = await admin
      .from("daily_challenges")
      .select("seed")
      .eq("challenge_date", date)
      .maybeSingle();
    if (existing.data?.seed) return { date, seed: existing.data.seed };

    const seed = `daily-${date}-${randomUUID().slice(0, 8)}`;
    const created = await admin
      .from("daily_challenges")
      .insert({ challenge_date: date, seed })
      .select("seed")
      .single();
    if (created.data?.seed) return { date, seed: created.data.seed };

    // Lost a creation race — re-read the row the other request inserted.
    const again = await admin
      .from("daily_challenges")
      .select("seed")
      .eq("challenge_date", date)
      .maybeSingle();
    return { date, seed: again.data?.seed ?? `daily-${date}` };
  } catch {
    return { date, seed: `daily-${date}` };
  }
}
