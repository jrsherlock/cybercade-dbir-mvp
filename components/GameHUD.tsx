"use client";

import { useEffect, useState } from "react";
import { gameBridge } from "@/game/bridge";
import { BALANCE } from "@/game/balance";
import type { WaveInfo } from "@/game/types";

const FIRST_WAVE: WaveInfo = {
  index: 1,
  total: 4,
  name: "First Contact",
  isBoss: false,
};

/** Read-only HUD overlay — score, wave, trust pips, streak. Bridge-driven. */
export default function GameHUD() {
  const [score, setScore] = useState(0);
  const [trust, setTrust] = useState<number>(BALANCE.trustMax);
  const [streak, setStreak] = useState(0);
  const [wave, setWave] = useState<WaveInfo>(FIRST_WAVE);

  useEffect(() => {
    const offs = [
      gameBridge.on("score", setScore),
      gameBridge.on("trust", setTrust),
      gameBridge.on("streak", setStreak),
      gameBridge.on("wave", setWave),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-4 py-2.5">
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          Score
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">
          {score.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span
          className={`font-mono text-[9px] font-bold uppercase tracking-widest ${
            wave.isBoss ? "text-danger" : "text-brand-2"
          }`}
        >
          {wave.isBoss ? "Boss Wave" : `Wave ${wave.index}/${wave.total}`}
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
        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wide text-muted">
          {wave.name}
        </span>
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
