/**
 * Gameplay tuning constants. Phaser-free on purpose so the React HUD can
 * import them too. Per-wave pacing (speed, spawn rate) lives in the content
 * pack's WaveDefs; this file holds board geometry and global tuning.
 */
export const BALANCE = {
  /** Trust pips the company starts with; 0 = game over. */
  trustMax: 5,
  /** The game's design resolution (portrait, 9:16). */
  width: 450,
  height: 800,
  /** y of the breach line — threats past this point breach the company. */
  breachLineY: 612,
  /** y where items spawn. */
  spawnY: 96,
  /** Top strip reserved for the React HUD overlay. */
  hudZoneY: 78,
  /** ms the between-wave banner is shown before the next wave spawns. */
  interstitialMs: 2300,
} as const;
