"use client";

import { useEffect, useRef } from "react";
import type Phaser from "phaser";

/**
 * Mounts the Phaser game. Phaser and the game code are dynamically imported
 * inside the effect so they never reach the server bundle and are code-split
 * out of the initial client chunk.
 */
export default function PhaserGame() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: Phaser.Game | undefined;
    let cancelled = false;

    void (async () => {
      const PhaserLib = (await import("phaser")).default;
      const { createGameConfig } = await import("@/game/config");
      if (cancelled || !parentRef.current) return;
      game = new PhaserLib.Game(createGameConfig(parentRef.current));
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
      game = undefined;
    };
  }, []);

  return <div ref={parentRef} className="absolute inset-0" />;
}
