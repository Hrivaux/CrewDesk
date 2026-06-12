/** Formatage des tokens et coûts (affichage fr). */

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",")} k`;
  return String(n);
}

export function formatUSD(n: number): string {
  if (n > 0 && n < 0.01) return "< 0,01 $";
  return `${n.toFixed(2).replace(".", ",")} $`;
}
