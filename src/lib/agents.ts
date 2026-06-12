import type { GridPos } from "@/lib/iso";
import type { AgentId, AgentRuntime, AgentStatus } from "@/services/types";
import { clamp01, easeWalk, pointAlong } from "@/lib/iso";

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  personality: string;
  /** Position de repos (zone pause, en bas de la scène). */
  idleSpot: GridPos;
  /** Poste de travail. */
  workSpot: GridPos;
  /** Atlas est plus grand et visuellement distinct. */
  isOrchestrator?: boolean;
}

export const AGENTS: readonly AgentDef[] = [
  {
    id: "atlas",
    name: "Atlas",
    role: "Orchestrateur",
    color: "#5EE7FF",
    personality: "Calme absolu. Voit tout, n'oublie rien, distribue juste.",
    idleSpot: { gx: 4.9, gy: 3.7 },
    workSpot: { gx: 4.9, gy: 3.7 },
    isOrchestrator: true,
  },
  {
    id: "pixel",
    name: "Pixel",
    role: "Design & Frontend",
    color: "#FF8A4C",
    personality: "Perfectionniste. Déteste les bugs en prod.",
    idleSpot: { gx: 2.7, gy: 4.6 },
    workSpot: { gx: 2.7, gy: 4.6 },
  },
  {
    id: "forge",
    name: "Forge",
    role: "Développement",
    color: "#4D8DFF",
    personality: "Méthodique. Ne livre jamais sans tests.",
    idleSpot: { gx: 7.2, gy: 4.6 },
    workSpot: { gx: 7.2, gy: 4.6 },
  },
  {
    id: "sonar",
    name: "Sonar",
    role: "Recherche & Analyse",
    color: "#3CDFA0",
    personality: "Curiosité insatiable. Cite toujours ses sources.",
    idleSpot: { gx: 8.2, gy: 6.1 },
    workSpot: { gx: 8.2, gy: 6.1 },
  },
  {
    id: "plume",
    name: "Plume",
    role: "Contenu & Rédaction",
    color: "#A777FF",
    personality: "Élégante. Traque la moindre coquille.",
    idleSpot: { gx: 3.0, gy: 6.3 },
    workSpot: { gx: 3.0, gy: 6.3 },
  },
  {
    id: "vega",
    name: "Vega",
    role: "Marketing & Planning",
    color: "#FFC94D",
    personality: "Énergique. Pense en roadmaps et en jalons.",
    idleSpot: { gx: 6.2, gy: 7.4 },
    workSpot: { gx: 6.2, gy: 7.4 },
  },
] as const;

export const AGENT_BY_ID: Record<AgentId, AgentDef> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a]),
) as Record<AgentId, AgentDef>;

export function initialRuntime(): Record<AgentId, AgentRuntime> {
  return Object.fromEntries(
    AGENTS.map((a) => [
      a.id,
      {
        id: a.id,
        status: (a.isOrchestrator ? "working" : "idle") as AgentStatus,
        taskId: null,
        pose: null,
      },
    ]),
  ) as Record<AgentId, AgentRuntime>;
}

export interface AgentRender {
  pos: GridPos;
  facing: "left" | "right";
  moving: boolean;
}

/** Petit attroupement autour de la machine à café (un spot par agent). */
export function breakSpot(def: AgentDef): GridPos {
  const idx = AGENTS.findIndex((a) => a.id === def.id);
  return { gx: 7.5 - (idx % 3) * 0.55, gy: 7.8 + (idx % 2) * 0.55 };
}

/** Position logique courante d'un agent (utilisée par la boucle rAF, hors React). */
export function agentRender(rt: AgentRuntime, def: AgentDef, now: number): AgentRender {
  if ((rt.status === "walking" || rt.status === "returning") && rt.pose) {
    const t = easeWalk(clamp01((now - rt.pose.startedAt) / rt.pose.duration));
    const { pos, dir } = pointAlong(rt.pose.path, t);
    // Orientation écran : dx_écran ∝ (dgx - dgy)
    const sx = dir.gx - dir.gy;
    return {
      pos,
      facing: sx < 0 ? "left" : "right",
      moving: t < 1,
    };
  }
  if (rt.status === "working") {
    return { pos: def.workSpot, facing: "right", moving: false };
  }
  if (rt.status === "break") {
    return { pos: breakSpot(def), facing: "right", moving: false };
  }
  return { pos: def.idleSpot, facing: "right", moving: false };
}
