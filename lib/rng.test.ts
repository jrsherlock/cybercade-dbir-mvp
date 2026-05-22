import { describe, it, expect } from "vitest";
import { makeRng, shuffle } from "./rng";

describe("makeRng", () => {
  it("is deterministic for the same seed", () => {
    const a = makeRng("daily-2026-05-22");
    const b = makeRng("daily-2026-05-22");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("differs for different seeds", () => {
    expect(makeRng("seed-one")()).not.toBe(makeRng("seed-two")());
  });

  it("produces values in [0, 1)", () => {
    const r = makeRng("x");
    for (let i = 0; i < 50; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  it("is deterministic for the same seed", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(items, makeRng("s"))).toEqual(shuffle(items, makeRng("s")));
  });

  it("preserves every element", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect([...shuffle(items, makeRng("z"))].sort()).toEqual([...items].sort());
  });

  it("does not mutate the input", () => {
    const items = [1, 2, 3];
    shuffle(items, makeRng("q"));
    expect(items).toEqual([1, 2, 3]);
  });
});
