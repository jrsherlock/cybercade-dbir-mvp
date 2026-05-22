/** Shared game types. Phaser-free — safe to import from React or the server. */

export type ResponseId = "verify" | "report" | "block" | "secure";
export type LaneId = "inbox" | "logins" | "devices" | "webai";
export type GameState = "idle" | "playing" | "over";

/** A threat or legit-decoy definition from a DBIR content pack. */
export interface GameItemDef {
  id: string;
  /** Short label shown on the falling item. */
  label: string;
  /** Emoji placeholder icon (real art swapped in at M6). */
  icon: string;
  lane: LaneId;
  isThreat: boolean;
  /** Correct response for a threat; null for a legit decoy. */
  correctResponse: ResponseId | null;
  /** DBIR micro-fact shown when the item is resolved. */
  fact: string;
}

/** One escalating wave. The boss wave is the final, most intense one. */
export interface WaveDef {
  /** 1-based wave number. */
  index: number;
  name: string;
  /** Ordered list of GameItemDef ids to spawn. */
  spawns: string[];
  /** ms between spawns. */
  spawnInterval: number;
  /** px/second items fall. */
  fallSpeed: number;
  isBoss?: boolean;
}

/** Pushed to the HUD whenever a wave begins. */
export interface WaveInfo {
  index: number;
  total: number;
  name: string;
  isBoss: boolean;
}

/** Per-lane threat-handling performance, for the Human Risk Profile scorecard. */
export interface CategoryResult {
  id: LaneId;
  /** Threats from this lane that left play (stopped, mis-handled, or breached). */
  faced: number;
  /** Threats from this lane stopped with the correct response. */
  stopped: number;
}

/** Final results emitted when a game ends. */
export interface GameResult {
  score: number;
  threatsStopped: number;
  /** 0..1. */
  accuracy: number;
  bestStreak: number;
  wavesCleared: number;
  /** True if the company survived all waves; false if trust hit 0. */
  survived: boolean;
  /** Per-lane breakdown — feeds the Human Risk Profile scorecard. */
  categories: CategoryResult[];
}
