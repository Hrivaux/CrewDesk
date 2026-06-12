// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { SimulatedOrchestrator, extractTopic } from "@/services/orchestrator";

const orch = new SimulatedOrchestrator();

describe("SimulatedOrchestrator — routage", () => {
  it("route une demande réseaux sociaux vers une campagne de contenu", async () => {
    const plan = await orch.plan("Crée-moi du contenu LinkedIn pour mon produit");
    expect(plan.summary.toLowerCase()).toContain("réseaux sociaux");
    expect(plan.tasks.some((t) => t.agentId === "plume")).toBe(true);
  });

  it("ne confond pas un site web (qui vend un SaaS) avec une campagne", async () => {
    const plan = await orch.plan("Un site web pour vendre mon SaaS");
    expect(plan.summary.toLowerCase()).toContain("site web");
  });

  it("produit un plan non vide avec des dépendances cohérentes", async () => {
    const plan = await orch.plan("campagne réseaux sociaux pour mon SaaS");
    expect(plan.tasks.length).toBeGreaterThan(3);
    for (const t of plan.tasks) {
      for (const dep of t.dependsOn ?? []) {
        expect(dep).toBeGreaterThanOrEqual(0);
        expect(dep).toBeLessThan(plan.tasks.length);
      }
    }
  });
});

describe("extractTopic", () => {
  it("extrait un sujet lisible en retirant les mots vides", () => {
    expect(extractTopic("Je veux un site pour mon app de fitness").toLowerCase()).toContain(
      "fitness",
    );
  });

  it("retombe sur un défaut si vide", () => {
    expect(extractTopic("je veux")).toBe("Nouveau projet");
  });
});
