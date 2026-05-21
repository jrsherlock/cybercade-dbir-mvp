"use client";

import { useEffect, useState } from "react";
import PhaserGame from "./PhaserGame";
import GameHUD from "./GameHUD";
import { gameBridge } from "@/game/bridge";
import type { GameResult, GameState } from "@/game/types";

/**
 * The game shell: hosts the Phaser canvas and the React chrome (HUD + start /
 * game-over overlays), wired together through the bridge.
 */
export default function GameMount() {
  const [state, setState] = useState<GameState>("idle");
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const offs = [
      gameBridge.on("state", setState),
      gameBridge.on("result", setResult),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const start = () => {
    setResult(null);
    gameBridge.emit("start", undefined);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-3">
      <div className="relative aspect-[9/16] h-full max-h-[860px] w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b0f] shadow-2xl">
        <PhaserGame />
        {state === "playing" && <GameHUD />}
        {state === "idle" && <StartOverlay onStart={start} />}
        {state === "over" && result && (
          <OverOverlay result={result} onRestart={start} />
        )}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0a0b0f]/95 px-7 text-center backdrop-blur-sm">
      {children}
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
    </Overlay>
  );
}

function OverOverlay({
  result,
  onRestart,
}: {
  result: GameResult;
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

      <dl className="grid w-full max-w-xs grid-cols-2 gap-3 text-left">
        <Stat label="Score" value={result.score.toLocaleString()} />
        <Stat label="Threats stopped" value={String(result.threatsStopped)} />
        <Stat label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} />
        <Stat label="Best streak" value={`${result.bestStreak}\u{1F525}`} />
      </dl>

      <PlayButton onClick={onRestart}>Play again</PlayButton>
      <p className="font-mono text-[10px] text-muted">
        Leaderboards & your personal Human Risk Profile are coming soon.
      </p>
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
