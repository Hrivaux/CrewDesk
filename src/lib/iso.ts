/**
 * Projection isométrique "fake-iso" en screen-space (2:1).
 * La grille logique va de 0 à GRID sur les deux axes ;
 * l'origine écran est le sommet haut du losange.
 */

export const GRID = 10;
export const TILE_W = 56;
export const TILE_H = TILE_W / 2;

/** Dimensions du plateau projeté (le losange inscrit). */
export const BOARD_W = GRID * TILE_W; // 560
export const BOARD_H = GRID * TILE_H; // 280

/** Épaisseur visuelle de la dalle. */
export const SLAB_T = 26;

export interface GridPos {
  gx: number;
  gy: number;
}

export interface ScreenPos {
  x: number;
  y: number;
}

/** Grille → écran. */
export function project(pos: GridPos): ScreenPos {
  return {
    x: BOARD_W / 2 + ((pos.gx - pos.gy) * TILE_W) / 2,
    y: ((pos.gx + pos.gy) * TILE_H) / 2,
  };
}

/** Profondeur de tri (z-index) : plus on est "bas" dans la scène, plus on passe devant. */
export function depth(pos: GridPos): number {
  return Math.round((pos.gx + pos.gy) * 10);
}

/** Chemin en L entre deux cases : d'abord l'axe X, puis l'axe Y. */
export function pathBetween(a: GridPos, b: GridPos): GridPos[] {
  if (a.gx === b.gx || a.gy === b.gy) return [a, b];
  return [a, { gx: b.gx, gy: a.gy }, b];
}

/** Longueur d'un chemin en unités de grille. */
export function pathLength(path: GridPos[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const cur = path[i];
    if (!prev || !cur) continue;
    len += Math.hypot(cur.gx - prev.gx, cur.gy - prev.gy);
  }
  return len;
}

export interface PathPoint {
  pos: GridPos;
  /** Direction du déplacement en grille (normalisée), nulle si chemin vide. */
  dir: GridPos;
}

/** Point situé à t ∈ [0,1] le long du chemin (vitesse constante). */
export function pointAlong(path: GridPos[], t: number): PathPoint {
  const first = path[0];
  if (!first) return { pos: { gx: 0, gy: 0 }, dir: { gx: 0, gy: 0 } };
  const total = pathLength(path);
  if (total === 0) return { pos: first, dir: { gx: 0, gy: 0 } };

  let target = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const cur = path[i];
    if (!prev || !cur) continue;
    const seg = Math.hypot(cur.gx - prev.gx, cur.gy - prev.gy);
    if (target <= seg || i === path.length - 1) {
      const k = seg === 0 ? 0 : target / seg;
      return {
        pos: {
          gx: prev.gx + (cur.gx - prev.gx) * k,
          gy: prev.gy + (cur.gy - prev.gy) * k,
        },
        dir: {
          gx: seg === 0 ? 0 : (cur.gx - prev.gx) / seg,
          gy: seg === 0 ? 0 : (cur.gy - prev.gy) / seg,
        },
      };
    }
    target -= seg;
  }
  const last = path[path.length - 1] ?? first;
  return { pos: last, dir: { gx: 0, gy: 0 } };
}

/** Vitesse de marche des agents, en cases par seconde. */
export const WALK_SPEED = 2.3;

/** Durée de marche (ms) pour un chemin donné. */
export function walkDuration(path: GridPos[]): number {
  return Math.max(450, (pathLength(path) / WALK_SPEED) * 1000);
}

export function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

/** Léger lissage aux extrémités, quasi linéaire au centre (marche naturelle). */
export function easeWalk(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c) * 0.25 + c * 0.75;
}
