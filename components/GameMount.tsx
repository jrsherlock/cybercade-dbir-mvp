"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import PhaserGame from "./PhaserGame";
import GameHUD from "./GameHUD";
import ScorecardPanel from "./ScorecardPanel";
import { gameBridge } from "@/game/bridge";
import { createClient } from "@/lib/supabase/client";
import { randomHandle } from "@/lib/handles";
import type { GameResult, GameState } from "@/game/types";

interface RankInfo {
  rank: number;
  total: number;
}

const HANDLE_KEY = "cybercade-handle";

/**
 * The game shell: hosts the Phaser canvas and React chrome, and bridges the
 * game to the backend — anonymous auth, a signed play session, and score
 * submission. Backend calls are best-effort: if they fail, the game still
 * plays, the score just isn't recorded.
 */
export default function GameMount() {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<GameState>("idle");
  const [result, setResult] = useState<GameResult | null>(null);
  const [rank, setRank] = useState<RankInfo | null>(null);
  const tokenRef = useRef<string | null>(null);
  const handleRef = useRef<string>("");

  // Establish the player's handle + anonymous auth session on mount.
  useEffect(() => {
    let handle = localStorage.getItem(HANDLE_KEY);
    if (!handle) {
      handle = randomHandle();
      localStorage.setItem(HANDLE_KEY, handle);
    }
    handleRef.current = handle;

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        posthog.identify(data.session.user.id);
      } else {
        void supabase.auth.signInAnonymously().then(({ data: anonData }) => {
          if (anonData.session) posthog.identify(anonData.session.user.id);
        });
      }
    });
  }, [supabase]);

  const openSession = useCallback(async () => {
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        await supabase.auth.signInAnonymously();
        session = (await supabase.auth.getSession()).data.session;
      }
      if (!session) return;
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { token?: string };
        tokenRef.current = json.token ?? null;
      }
    } catch {
      // backend not ready / offline — the game still plays.
    }
  }, [supabase]);

  const submitScore = useCallback(
    async (r: GameResult) => {
      const token = tokenRef.current;
      tokenRef.current = null;
      if (!token) return;
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;
        const res = await fetch("/api/score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            token,
            score: r.score,
            accuracy: r.accuracy,
            bestStreak: r.bestStreak,
            threatsStopped: r.threatsStopped,
            wavesCleared: r.wavesCleared,
            survived: r.survived,
            displayName: handleRef.current,
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as RankInfo;
          setRank(json);
        }
      } catch {
        // score submission is best-effort.
      }
    },
    [supabase],
  );

  useEffect(() => {
    const offState = gameBridge.on("state", setState);
    const offResult = gameBridge.on("result", (r) => {
      setResult(r);
      void submitScore(r);
      posthog.capture(r.survived ? "game_completed" : "game_over", {
        score: r.score,
        threats_stopped: r.threatsStopped,
        accuracy: r.accuracy,
        best_streak: r.bestStreak,
        waves_cleared: r.wavesCleared,
      });
    });
    const offWave = gameBridge.on("wave", (w) => {
      posthog.capture("wave_started", {
        wave_index: w.index,
        wave_name: w.name,
        wave_total: w.total,
        is_boss: w.isBoss,
      });
    });
    return () => {
      offState();
      offResult();
      offWave();
    };
  }, [submitScore]);

  const start = useCallback(() => {
    setResult(null);
    setRank(null);
    tokenRef.current = null;
    posthog.capture("game_started");
    gameBridge.emit("start", undefined);
    void openSession();
  }, [openSession]);

  return (
    <div className="flex flex-1 items-center justify-center p-3">
      <div className="relative aspect-[9/16] h-full max-h-[860px] w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b0f] shadow-2xl">
        <PhaserGame />
        {state === "playing" && <GameHUD />}
        {state === "idle" && <StartOverlay onStart={start} />}
        {state === "over" && result && (
          <OverOverlay result={result} rank={rank} onRestart={start} />
        )}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0a0b0f]/95 backdrop-blur-sm">
      <div className="flex min-h-full flex-col">
        <div className="m-auto flex w-full max-w-sm flex-col items-center gap-5 px-7 py-8 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

function PlayButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-brand px-9 py-3 text-base font-bold text-[#0a0b0f] transition-transform hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}

function StartOverlay({ onStart }: { onStart: () => void }) {
  return (
    <Overlay>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-2">
        2026-DBIR Edition
      </p>
      <h1 className="text-3xl font-bold tracking-tight">
        Defend the <span className="text-brand">Human Firewall</span>
      </h1>
      <p className="max-w-xs text-balance text-sm leading-relaxed text-muted">
        Threats fall down four lanes. Tap a real one, then pick the right
        response — <span className="text-foreground">Verify, Report, Block,
        Secure</span> — before it crosses the breach line. Leave the legit
        decoys alone. Survive four escalating waves, ending with the Shadow AI
        Surge — lose all five trust pips and the company is breached.
      </p>
      <PlayButton onClick={onStart}>Start Wave 1</PlayButton>
      <Link
        href="/leaderboard"
        className="font-mono text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        View leaderboard
      </Link>
    </Overlay>
  );
}

function OverOverlay({
  result,
  rank,
  onRestart,
}: {
  result: GameResult;
  rank: RankInfo | null;
  onRestart: () => void;
}) {
  return (
    <Overlay>
      <h2
        className={`text-3xl font-bold tracking-tight ${
          result.survived ? "text-brand" : "text-danger"
        }`}
      >
        {result.survived
          ? "All Waves Cleared!"
          : `Breached — Wave ${result.wavesCleared + 1}`}
      </h2>

      {rank && (
        <p className="font-mono text-sm text-brand-2">
          Ranked #{rank.rank.toLocaleString()} of {rank.total.toLocaleString()}
        </p>
      )}

      <dl className="grid w-full grid-cols-2 gap-3 text-left">
        <Stat label="Score" value={result.score.toLocaleString()} />
        <Stat label="Threats stopped" value={String(result.threatsStopped)} />
        <Stat label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} />
        <Stat label="Best streak" value={`${result.bestStreak}\u{1F525}`} />
      </dl>

      <div className="h-px w-full bg-white/10" />
      <ScorecardPanel result={result} />
      <div className="h-px w-full bg-white/10" />

      <PlayButton onClick={onRestart}>Play again</PlayButton>
      <Link
        href="/leaderboard"
        className="font-mono text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => posthog.capture("leaderboard_link_clicked")}
      >
        View leaderboard
      </Link>
    </Overlay>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-surface px-3 py-2">
      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-lg font-bold text-foreground">
        {value}
      </dd>
    </div>
  );
}
