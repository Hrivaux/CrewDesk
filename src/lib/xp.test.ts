import { describe, expect, it } from "vitest";
import { levelFromXp, levelProgress, xpForLevel } from "@/lib/xp";

describe("levelFromXp", () => {
  it("démarre au niveau 1", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-10)).toBe(1);
  });

  it("monte de niveau aux paliers quadratiques (60·(L-1)²)", () => {
    expect(levelFromXp(60)).toBe(2);
    expect(levelFromXp(239)).toBe(2);
    expect(levelFromXp(240)).toBe(3);
  });
});

describe("xpForLevel", () => {
  it("est cohérent avec levelFromXp", () => {
    for (let lvl = 1; lvl <= 6; lvl++) {
      expect(levelFromXp(xpForLevel(lvl))).toBe(lvl);
    }
  });
});

describe("levelProgress", () => {
  it("reste dans [0, 100]", () => {
    for (const xp of [0, 30, 60, 200, 240, 1000]) {
      const p = levelProgress(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(100.0001);
    }
  });

  it("vaut ~0 juste après un palier", () => {
    expect(levelProgress(60)).toBeCloseTo(0, 5);
  });
});
