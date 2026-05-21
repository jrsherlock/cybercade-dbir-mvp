/**
 * Pure scoring logic — shared by the Phaser game client and (from M3) the
 * server-side score validation. No Phaser or React imports: keep it pure so it
 * runs anywhere and stays unit-testable as the anti-cheat oracle.
 */

export const SCORING = {
  /** Points for any correct resolution, before speed/streak bonuses. */
  basePoints: 100,
  /** Extra points for catching a threat the instant it appears. */
  maxSpeedBonus: 100,
  /** Multiplier added per consecutive correct resolution. */
  streakStep: 0.1,
  /** Streak count at which the multiplier stops growing. */
  maxStreakBonus: 10,
} as const;

/** Streak multiplier: 1.0 at streak 0, +streakStep per streak, capped. */
export function streakMultiplier(streak: number): number {
  const capped = Math.max(0, Math.min(streak, SCORING.maxStreakBonus));
  return 1 + capped * SCORING.streakStep;
}

export interface ResolutionInput {
  /** Was the player's response correct? Incorrect resolutions score 0. */
  correct: boolean;
  /** 0..1 — fraction of the lane still remaining when caught (1 = caught instantly). */
  timeRatio: number;
  /** Streak count BEFORE this resolution. */
  streak: number;
}

/** Points awarded for resolving a single threat. */
export function scoreResolution({ correct, timeRatio, streak }: ResolutionInput): number {
  if (!correct) return 0;
  const ratio = Math.max(0, Math.min(timeRatio, 1));
  const base = SCORING.basePoints + Math.round(SCORING.maxSpeedBonus * ratio);
  return Math.round(base * streakMultiplier(streak));
}
