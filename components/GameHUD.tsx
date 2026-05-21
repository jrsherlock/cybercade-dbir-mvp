"use client";

import { useEffect, useState } from "react";
import { gameBridge } from "@/game/bridge";
import { BALANCE } from "@/game/balance";

/** Read-only HUD overlay — score, trust pips, streak. Driven by the bridge. */
export default function GameHUD() {
  const [score, setScore] = useState(0);
  const [trust, setTrust] = useState<number>(BALANCE.trustMax);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const offs = [
      gameBridge.on("score", setScore),
      gameBridge.on("trust", setTrust),
      gameBridge.on("streak", setStreak),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-4 py-2.5">
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          Score
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">
          {score.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          Company Trust
        </span>
        <div className="mt-1 flex gap-1">
          {Array.from({ length: BALANCE.trustMax }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i < trust ? "bg-brand" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          Streak
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-warning">
          {streak > 0 ? `${streak}\u{1F525}` : "—"}
        </span>
      </div>
    </div>
  );
}
