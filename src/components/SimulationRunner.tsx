"use client";

import { useSimulation } from "@/services/orchestrator";

/** Démarre la simulation au niveau du layout : elle vit sur toutes les routes. */
export function SimulationRunner() {
  useSimulation();
  return null;
}
