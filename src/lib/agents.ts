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
    idleSpot: { gx: 4.2, gy: 3.4 },
    workSpot: { gx: 5, gy: 2.2 },
    isOrchestrator: true,
  },
  {
    id: "pixel",
    name: "Pixel",
    role: "Design & Frontend",
    color: "#FF8A4C",
    personality: "Perfectionniste. Déteste les bugs en prod.",
    idleSpot: { gx: 3.4, gy: 8.2 },
    workSpot: { gx: 2.2, gy: 3.2 },
  },
  {
    id: "forge",
    name: "Forge",
    role: "Développement",
    color: "#4D8DFF",
    personality: "Méthodique. Ne livre jamais sans tests.",
    idleSpot: { gx: 4.6, gy: 8.5 },
    workSpot: { gx: 7.8, gy: 3.2 },
  },
  {
    id: "sonar",
    name: "Sonar",
    role: "Recherche & Analyse",
    color: "#3CDFA0",
    personality: "Curiosité insatiable. Cite toujours ses sources.",
    idleSpot: { gx: 5.8, gy: 8.2 },
    workSpot: { gx: 7.9, gy: 5.1 },
  },
  {
    id: "plume",
    name: "Plume",
    role: "Contenu & Rédaction",
    color: "#A777FF",
    personality: "Élégante. Traque la moindre coquille.",
    idleSpot: { gx: 6.9, gy: 8.5 },
    workSpot: { gx: 2.1, gy: 5.1 },
  },
  {
    id: "vega",
    name: "Vega",
    role: "Marketing & Planning",
    color: "#FFC94D",
    personality: "Énergique. Pense en roadmaps et en jalons.",
    idleSpot: { gx: 7.9, gy: 7.6 },
    workSpot: { gx: 6.3, gy: 2.1 },
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
  return { pos: def.idleSpot, facing: "right", moving: false };
}
