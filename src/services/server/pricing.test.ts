import { describe, expect, it } from "vitest";
import { addMessageUsage, emptyUsage, priceUsage } from "@/services/server/pricing";
import type Anthropic from "@anthropic-ai/sdk";

function fakeMessage(usage: Record<string, unknown>): Anthropic.Message {
  return { usage } as unknown as Anthropic.Message;
}

describe("priceUsage", () => {
  it("facture entrée et sortie au tarif du modèle", () => {
    const u = emptyUsage();
    u.inputTokens = 1_000_000;
    u.outputTokens = 1_000_000;
    const priced = priceUsage(u, "claude-opus-4-8");
    expect(priced.costUSD).toBeCloseTo(30, 4); // 5 + 25
  });

  it("applique les multiplicateurs de cache (lu ×0,1, écrit ×1,25)", () => {
    const u = emptyUsage();
    u.cacheReadTokens = 1_000_000;
    u.cacheWriteTokens = 1_000_000;
    const priced = priceUsage(u, "claude-opus-4-8");
    // 5*0,1 + 5*1,25 = 0,5 + 6,25
    expect(priced.costUSD).toBeCloseTo(6.75, 4);
  });

  it("compte les recherches web à l'unité", () => {
    const u = emptyUsage();
    u.webSearches = 10;
    expect(priceUsage(u, "claude-opus-4-8").costUSD).toBeCloseTo(0.1, 4);
  });

  it("retombe sur le tarif Opus pour un modèle inconnu", () => {
    const u = emptyUsage();
    u.inputTokens = 1_000_000;
    expect(priceUsage(u, "modele-bidon").costUSD).toBeCloseTo(5, 4);
  });
});

describe("addMessageUsage", () => {
  it("cumule tokens, cache et recherches web sur plusieurs réponses", () => {
    const totals = emptyUsage();
    addMessageUsage(
      totals,
      fakeMessage({
        input_tokens: 100,
        output_tokens: 50,
        cache_read_input_tokens: 10,
        cache_creation_input_tokens: 5,
        server_tool_use: { web_search_requests: 2 },
      }),
    );
    addMessageUsage(totals, fakeMessage({ input_tokens: 100, output_tokens: 50 }));
    expect(totals.inputTokens).toBe(200);
    expect(totals.outputTokens).toBe(100);
    expect(totals.cacheReadTokens).toBe(10);
    expect(totals.webSearches).toBe(2);
  });
});
