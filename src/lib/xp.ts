/** Niveau atteint pour un total d'XP (palier L = 60·(L-1)²). */
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1;
}

/** XP cumulée requise pour atteindre un niveau. */
export function xpForLevel(level: number): number {
  return 60 * (level - 1) * (level - 1);
}

/** Progression (0 → 100) à l'intérieur du niveau courant. */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return ((xp - floor) / (ceil - floor)) * 100;
}
