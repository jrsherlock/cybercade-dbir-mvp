/**
 * Gameplay tuning constants. Phaser-free on purpose so the React HUD can
 * import them too (e.g. to render the right number of trust pips).
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
  hudZoneY: 70,
  /** px/second a threat item falls. */
  fallSpeed: 82,
  /** ms between spawns in wave 1. */
  spawnInterval: 1900,
} as const;
