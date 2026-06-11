import type { GridPos } from "@/lib/iso";

export type AgentId = "atlas" | "pixel" | "forge" | "sonar" | "plume" | "vega";

export type AgentStatus = "idle" | "walking" | "working" | "returning" | "break";

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
  /** Tâches (ids) dont le livrable est requis avant de commencer. */
  dependsOnIds?: string[];
  /** Résultat produit par l'agent (markdown) en mode live. */
  deliverable?: string;
  /** Origine : créée par la simulation ou via un plan validé. */
  source?: "sim" | "live";
  /** Tentatives d'exécution (live) — au-delà de 2, dispatch manuel requis. */
  attempts?: number;
  error?: string;
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
  /** Nom de projet proposé par Atlas (mode live). */
  projectName?: string;
  tasks: PlannedTask[];
}

/** Réponse d'Atlas dans le chat : une question/réponse, ou un plan à valider. */
export type AtlasReply =
  | { type: "text"; text: string }
  | { type: "plan"; text: string; plan: Plan };

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
  /** Fin de la pause café en cours. */
  breakUntil?: number;
}

/** Une tâche terminée, dans l'historique d'un agent. */
export interface CompletionRecord {
  taskId: string;
  title: string;
  at: number;
  tags: string[];
}

/** Progression d'un agent : il gagne de l'XP en terminant des tâches. */
export interface AgentStats {
  xp: number;
  done: number;
  history: CompletionRecord[];
}

/** Notification éphémère (toast verre dépoli). */
export interface Toast {
  id: string;
  title: string;
  message?: string;
  color: string;
}

export type ScenePhase = "auto" | "day" | "night";

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

/** Message du chat avec Atlas. */
export interface ChatMessage {
  id: string;
  role: "user" | "atlas";
  text: string;
  at: number;
  /** Si ce message porte un plan (affiché tant qu'il est en attente). */
  planId?: string;
}
