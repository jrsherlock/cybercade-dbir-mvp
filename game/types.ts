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

export interface WaveDef {
  index: number;
  /** Ordered list of GameItemDef ids to spawn. */
  spawns: string[];
}

/** Final results emitted when a game ends. */
export interface GameResult {
  score: number;
  threatsStopped: number;
  /** 0..1. */
  accuracy: number;
  bestStreak: number;
  /** True if the company survived the wave; false if trust hit 0. */
  survived: boolean;
}
