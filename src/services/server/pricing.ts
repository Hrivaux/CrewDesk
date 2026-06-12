import type Anthropic from "@anthropic-ai/sdk";

/**
 * Calcul du coût d'usage côté serveur, au tarif du modèle utilisé.
 * Le solde réel du compte n'étant pas exposé par l'API, CrewDesk
 * mesure précisément ce qui est consommé (cache et recherches incluses).
 */

/** $ par million de tokens (entrée / sortie). */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-fable-5": { input: 10, output: 50 },
};

/** $ par recherche web. */
const WEB_SEARCH_USD = 0.01;

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
  costUSD: number;
}

export function emptyUsage(): UsageTotals {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    webSearches: 0,
    costUSD: 0,
  };
}

/** Ajoute l'usage d'une réponse au total (le coût est recalculé à la fin). */
export function addMessageUsage(totals: UsageTotals, message: Anthropic.Message): void {
  const u = message.usage;
  totals.inputTokens += u.input_tokens ?? 0;
  totals.outputTokens += u.output_tokens ?? 0;
  totals.cacheReadTokens += u.cache_read_input_tokens ?? 0;
  totals.cacheWriteTokens += u.cache_creation_input_tokens ?? 0;
  const serverTools = (
    u as { server_tool_use?: { web_search_requests?: number } }
  ).server_tool_use;
  totals.webSearches += serverTools?.web_search_requests ?? 0;
}

/** Calcule le coût en $ : entrée pleine, sortie, cache lu ×0,1, cache écrit ×1,25. */
export function priceUsage(totals: UsageTotals, model: string): UsageTotals {
  const price = PRICES[model] ?? PRICES["claude-opus-4-8"] ?? { input: 5, output: 25 };
  const M = 1_000_000;
  const costUSD =
    (totals.inputTokens / M) * price.input +
    (totals.outputTokens / M) * price.output +
    (totals.cacheReadTokens / M) * price.input * 0.1 +
    (totals.cacheWriteTokens / M) * price.input * 1.25 +
    totals.webSearches * WEB_SEARCH_USD;
  return { ...totals, costUSD: Math.round(costUSD * 10_000) / 10_000 };
}
