import { describe, it, expect } from "vitest";
import { scoreResolution, streakMultiplier, SCORING } from "./index";

describe("streakMultiplier", () => {
  it("is 1.0 at streak 0", () => {
    expect(streakMultiplier(0)).toBe(1);
  });

  it("adds streakStep per streak", () => {
    expect(streakMultiplier(3)).toBeCloseTo(1.3);
  });

  it("caps at maxStreakBonus", () => {
    expect(streakMultiplier(999)).toBeCloseTo(
      1 + SCORING.maxStreakBonus * SCORING.streakStep,
    );
  });

  it("treats a negative streak as 0", () => {
    expect(streakMultiplier(-5)).toBe(1);
  });
});

describe("scoreResolution", () => {
  it("scores 0 for an incorrect resolution", () => {
    expect(scoreResolution({ correct: false, timeRatio: 1, streak: 5 })).toBe(0);
  });

  it("awards base + full speed bonus when caught instantly", () => {
    expect(scoreResolution({ correct: true, timeRatio: 1, streak: 0 })).toBe(
      SCORING.basePoints + SCORING.maxSpeedBonus,
    );
  });

  it("awards only base points when caught at the breach line", () => {
    expect(scoreResolution({ correct: true, timeRatio: 0, streak: 0 })).toBe(
      SCORING.basePoints,
    );
  });

  it("applies the streak multiplier", () => {
    const base = scoreResolution({ correct: true, timeRatio: 0, streak: 0 });
    const withStreak = scoreResolution({ correct: true, timeRatio: 0, streak: 5 });
    expect(withStreak).toBe(Math.round(base * 1.5));
  });

  it("clamps timeRatio above 1", () => {
    expect(scoreResolution({ correct: true, timeRatio: 5, streak: 0 })).toBe(
      SCORING.basePoints + SCORING.maxSpeedBonus,
    );
  });
});
