import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Leaderboard — Cybercade 2026-DBIR Edition",
};

export const dynamic = "force-dynamic";

interface Row {
  rank: number;
  score: number;
  display_name: string;
  accuracy: number;
  best_streak: number;
  wave_reached: number;
  survived: boolean;
}

async function topScores(view: string): Promise<Row[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from(view)
      .select(
        "rank, score, display_name, accuracy, best_streak, wave_reached, survived",
      )
      .order("rank", { ascending: true })
      .limit(25);
    return (data as Row[] | null) ?? [];
  } catch {
    return [];
  }
}

function Tab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-brand text-[#0a0b0f]"
          : "border border-white/10 text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab === "daily" ? "daily" : "global";
  const rows = await topScores(
    tab === "daily" ? "daily_leaderboard" : "leaderboard",
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-2">
        Cybercade · 2026-DBIR Edition
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Leaderboard</h1>
      <p className="mt-2 text-sm text-muted">
        Top human firewalls.{" "}
        <Link href="/play" className="text-brand hover:underline">
          Think you can do better?
        </Link>
      </p>

      <div className="mt-6 flex gap-2">
        <Tab href="/leaderboard" label="All-time" active={tab === "global"} />
        <Tab href="/leaderboard?tab=daily" label="Today" active={tab === "daily"} />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {tab === "daily"
              ? "No daily-challenge scores yet today — be the first."
              : "No scores yet — be the first to make the board."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-surface font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Defender</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Acc.</th>
                <th className="px-4 py-3 text-right">Wave</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono font-bold text-muted">
                    {r.rank}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.display_name}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-brand">
                    {r.score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                    {Math.round(r.accuracy * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {r.survived ? (
                      <span className="text-brand">cleared</span>
                    ) : (
                      <span className="text-muted">{r.wave_reached}/4</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 flex gap-4 font-mono text-xs text-muted">
        <Link href="/play" className="hover:text-foreground">
          ← Free play
        </Link>
        <Link href="/daily" className="hover:text-foreground">
          Daily challenge
        </Link>
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
      </div>
    </main>
  );
}
