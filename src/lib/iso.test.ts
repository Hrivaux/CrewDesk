import { describe, expect, it } from "vitest";
import {
  BOARD_W,
  depth,
  pathBetween,
  pathLength,
  pointAlong,
  project,
  walkDuration,
} from "@/lib/iso";

describe("project", () => {
  it("place l'origine de grille au centre-haut du plateau", () => {
    expect(project({ gx: 0, gy: 0 })).toEqual({ x: BOARD_W / 2, y: 0 });
  });

  it("décale en X selon (gx - gy) et en Y selon (gx + gy)", () => {
    const p = project({ gx: 2, gy: 0 });
    expect(p.x).toBeGreaterThan(BOARD_W / 2);
    expect(project({ gx: 1, gy: 1 }).x).toBe(BOARD_W / 2);
  });
});

describe("depth", () => {
  it("croît avec la profondeur gx + gy", () => {
    expect(depth({ gx: 5, gy: 5 })).toBeGreaterThan(depth({ gx: 0, gy: 0 }));
  });
});

describe("pathBetween", () => {
  it("relie directement deux points alignés", () => {
    expect(pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 4 })).toHaveLength(2);
  });

  it("passe par un coude en L pour deux points diagonaux", () => {
    const path = pathBetween({ gx: 0, gy: 0 }, { gx: 3, gy: 4 });
    expect(path).toHaveLength(3);
    expect(path[1]).toEqual({ gx: 3, gy: 0 });
  });
});

describe("pointAlong", () => {
  it("renvoie les extrémités à t=0 et t=1", () => {
    const path = pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 4 });
    expect(pointAlong(path, 0).pos).toEqual({ gx: 0, gy: 0 });
    expect(pointAlong(path, 1).pos).toEqual({ gx: 0, gy: 4 });
  });

  it("interpole au milieu", () => {
    const path = pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 4 });
    expect(pointAlong(path, 0.5).pos.gy).toBeCloseTo(2);
  });
});

describe("walkDuration", () => {
  it("respecte un plancher pour les courts trajets", () => {
    expect(walkDuration(pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 0 }))).toBe(450);
  });

  it("augmente avec la longueur", () => {
    const court = walkDuration(pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 1 }));
    const long = walkDuration(pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 9 }));
    expect(long).toBeGreaterThan(court);
    expect(pathLength(pathBetween({ gx: 0, gy: 0 }, { gx: 0, gy: 9 }))).toBe(9);
  });
});
