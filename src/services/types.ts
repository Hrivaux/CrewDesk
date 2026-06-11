import type { GridPos } from "@/lib/iso";

export type AgentId = "atlas" | "pixel" | "forge" | "sonar" | "plume" | "vega";

export type AgentStatus = "idle" | "walking" | "working" | "returning";

export type TaskStatus = "backlog" | "assigned" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  agentId: AgentId;
  status: TaskStatus;
  /** 0 → 100 */
  progress: number;
  /** Estimation affichée, en minutes (la simulation la compresse). */
  estimateMin: number;
  tags: string[];
  projectId?: string;
  createdAt: number;
  startedAt?: number;
  reviewAt?: number;
  completedAt?: number;
}

/** Un projet = un objectif + ses tâches (reliées par projectId). */
export interface Project {
  id: string;
  name: string;
  objective: string;
  color: string;
  deadline: number;
  createdAt: number;
}

export interface PlannedTask {
  title: string;
  description: string;
  agentId: AgentId;
  estimateMin: number;
  tags: string[];
  dependsOn?: number[];
}

export interface Plan {
  id: string;
  request: string;
  summary: string;
  tasks: PlannedTask[];
}

/**
 * Couche d'orchestration. V1 : SimulatedOrchestrator (mock).
 * V2 : ClaudeOrchestrator (API Anthropic) — même interface, zéro changement UI.
 */
export interface IOrchestrator {
  plan(request: string): Promise<Plan>;
}

export type ActivityKind = "dispatch" | "start" | "review" | "done" | "system";

export interface ActivityEvent {
  id: string;
  at: number;
  kind: ActivityKind;
  agentId: AgentId | null;
  message: string;
}

/** Déplacement en cours d'un agent dans le diorama. */
export interface Pose {
  path: GridPos[];
  startedAt: number;
  duration: number;
}

export interface AgentRuntime {
  id: AgentId;
  status: AgentStatus;
  taskId: string | null;
  pose: Pose | null;
}

/** Paquet lumineux envoyé par Atlas vers le poste d'un agent. */
export interface DispatchFx {
  id: string;
  to: AgentId;
  color: string;
  taskTitle: string;
}

/** Micro-célébration (confettis) quand une carte atteint « Terminé ». */
export interface Celebration {
  id: string;
  taskId: string;
  color: string;
}
