import type { AgentId, AgentStatus, Task, TaskStatus } from "@/services/types";

export type VisualStatus = "idle" | "working" | "blocked" | "review" | "done";
export type SceneZoneId = "planning" | "coding" | "review" | "qa" | "deploy" | "security" | "memory";
export type ScenePluginId =
  | "GitHub"
  | "Figma"
  | "Linear"
  | "Slack"
  | "Browser"
  | "Vercel"
  | "Calendar"
  | "Memory"
  | "Security"
  | "Terminal"
  | "Docs"
  | "Logs";

export interface SceneZone {
  id: SceneZoneId;
  name: string;
  shortName: string;
  function: string;
  position: [number, number, number];
  hitbox: [number, number, number];
  color: string;
  plugins: ScenePluginId[];
}

export interface ScenePlugin {
  id: ScenePluginId;
  label: string;
  function: string;
  position: [number, number, number];
  color: string;
}

export interface SceneAgentBase {
  id: "atlas" | "pixel" | "forge" | "sonar" | "vega";
  sourceId: AgentId;
  name: string;
  role: string;
  color: string;
  skills: string[];
  plugins: ScenePluginId[];
  homePosition: [number, number, number];
  labelOffset: [number, number, number];
  defaultZone: SceneZoneId;
  fallbackTask: string;
  fallbackProgress: number;
  fallbackStatus: VisualStatus;
  fallbackAction: string;
}

export interface SceneAgent extends SceneAgentBase {
  status: VisualStatus;
  currentTask: string;
  progress: number;
  zone: SceneZoneId;
  zoneName: string;
  targetPosition: [number, number, number];
  taskId?: string;
  lastAction: string;
}

export const STATUS_LABEL: Record<VisualStatus, string> = {
  idle: "Idle",
  working: "Working",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
};

export const STATUS_COLOR: Record<VisualStatus, string> = {
  idle: "#94a3b8",
  working: "#22d3ee",
  blocked: "#fb7185",
  review: "#f97316",
  done: "#22c55e",
};

export const SCENE_ZONES: Record<SceneZoneId, SceneZone> = {
  planning: {
    id: "planning",
    name: "Planning Zone",
    shortName: "Planning",
    function: "Priorisation, backlog, routage des tâches et lookup mémoire.",
    position: [-2.55, 0.05, -0.82],
    hitbox: [2.25, 0.16, 1.65],
    color: "#8b5cf6",
    plugins: ["Linear", "Calendar", "Memory"],
  },
  coding: {
    id: "coding",
    name: "Coding Zone",
    shortName: "Code",
    function: "Développement, terminal, commits, PR et intégrations API.",
    position: [-0.22, 0.05, -0.04],
    hitbox: [2.42, 0.16, 1.82],
    color: "#22d3ee",
    plugins: ["GitHub", "Figma", "Terminal"],
  },
  review: {
    id: "review",
    name: "Review Zone",
    shortName: "Review",
    function: "Validation des livrables, checks PR et retours à corriger.",
    position: [2.25, 0.05, -1.04],
    hitbox: [1.82, 0.16, 1.45],
    color: "#f97316",
    plugins: ["GitHub", "Slack"],
  },
  qa: {
    id: "qa",
    name: "QA Zone",
    shortName: "QA",
    function: "Tests, recherche, validation navigateur et détection de bugs.",
    position: [1.68, 0.05, 1.3],
    hitbox: [1.86, 0.16, 1.45],
    color: "#22c55e",
    plugins: ["Browser", "Docs"],
  },
  deploy: {
    id: "deploy",
    name: "Deploy Zone",
    shortName: "Deploy",
    function: "Pipeline Vercel, état production, monitoring et rollback.",
    position: [-2.62, 0.05, 1.36],
    hitbox: [2.15, 0.16, 1.58],
    color: "#eab308",
    plugins: ["Vercel", "Logs", "Security"],
  },
  security: {
    id: "security",
    name: "Security Gate",
    shortName: "Security",
    function: "Validation humaine, permissions, accès sensibles et secrets.",
    position: [2.68, 0.05, 0.9],
    hitbox: [1.15, 0.18, 1.22],
    color: "#fb7185",
    plugins: ["Security", "Memory"],
  },
  memory: {
    id: "memory",
    name: "Memory Vault",
    shortName: "Memory",
    function: "Contexte long terme, documents, décisions et mémoire projet.",
    position: [-3.5, 0.05, 0.72],
    hitbox: [1.1, 0.18, 1.65],
    color: "#38bdf8",
    plugins: ["Memory", "Docs"],
  },
};

export const SCENE_PLUGINS: ScenePlugin[] = [
  { id: "GitHub", label: "GitHub", function: "PR, branches et commits", position: [-0.95, 0.74, -2.25], color: "#22d3ee" },
  { id: "Figma", label: "Figma", function: "Maquettes et composants UI", position: [-3.35, 0.74, -1.85], color: "#8b5cf6" },
  { id: "Linear", label: "Linear", function: "Tickets, backlog et priorités", position: [-2.28, 0.74, -2.25], color: "#eab308" },
  { id: "Slack", label: "Slack", function: "Messages et alertes équipe", position: [3.52, 0.74, -1.35], color: "#22c55e" },
  { id: "Browser", label: "Browser", function: "Recherche et vérification web", position: [3.58, 0.92, 0.0], color: "#22d3ee" },
  { id: "Vercel", label: "Vercel", function: "Builds et production", position: [-1.86, 0.74, 2.15], color: "#07111f" },
  { id: "Calendar", label: "Calendar", function: "Planning et jalons", position: [-3.62, 0.74, -0.45], color: "#f97316" },
  { id: "Memory", label: "Memory", function: "Contexte, docs et secrets", position: [-3.48, 0.92, 1.34], color: "#38bdf8" },
];

export const SCENE_AGENT_BASES: readonly SceneAgentBase[] = [
  {
    id: "atlas",
    sourceId: "atlas",
    name: "Atlas",
    role: "Orchestrateur",
    color: "#22d3ee",
    skills: ["Planning", "Routing", "Prioritization", "Memory lookup"],
    plugins: ["Linear", "Calendar", "Memory"],
    homePosition: [-2.72, 0, -0.86],
    labelOffset: [-0.16, 0.46, -0.06],
    defaultZone: "planning",
    fallbackTask: "Priorise le backlog produit",
    fallbackProgress: 72,
    fallbackStatus: "working",
    fallbackAction: "A routé les tâches vers les bons spécialistes",
  },
  {
    id: "pixel",
    sourceId: "pixel",
    name: "Pixel",
    role: "UI Builder",
    color: "#f97316",
    skills: ["Frontend", "Design system", "UX", "Dashboard UI"],
    plugins: ["Figma", "GitHub"],
    homePosition: [-0.54, 0, -0.18],
    labelOffset: [0.22, 0.18, 0.05],
    defaultZone: "coding",
    fallbackTask: "Améliore le dashboard analytics",
    fallbackProgress: 46,
    fallbackStatus: "working",
    fallbackAction: "A mis à jour la surface analytics",
  },
  {
    id: "forge",
    sourceId: "forge",
    name: "Forge",
    role: "Developer",
    color: "#5f93e8",
    skills: ["Code", "Refactor", "Debugging", "API integration"],
    plugins: ["GitHub", "Terminal"],
    homePosition: [0.16, 0, 0.1],
    labelOffset: [0.22, 0.04, 0.1],
    defaultZone: "coding",
    fallbackTask: "En attente de review",
    fallbackProgress: 34,
    fallbackStatus: "idle",
    fallbackAction: "Terminal prêt pour la prochaine mission",
  },
  {
    id: "sonar",
    sourceId: "sonar",
    name: "Sonar",
    role: "Research & QA",
    color: "#22c55e",
    skills: ["Testing", "Research", "Validation", "Bug detection"],
    plugins: ["Browser", "Docs"],
    homePosition: [1.56, 0, 1.22],
    labelOffset: [0.2, 0.34, -0.06],
    defaultZone: "qa",
    fallbackTask: "Teste la synchronisation Kanban",
    fallbackProgress: 61,
    fallbackStatus: "review",
    fallbackAction: "A relancé une vérification navigateur",
  },
  {
    id: "vega",
    sourceId: "vega",
    name: "Vega",
    role: "Deploy",
    color: "#eab308",
    skills: ["Release", "Monitoring", "Deployment", "Rollback"],
    plugins: ["Vercel", "Logs", "Security"],
    homePosition: [-2.62, 0, 1.38],
    labelOffset: [-0.04, 0.52, 0.14],
    defaultZone: "deploy",
    fallbackTask: "Attend une validation humaine",
    fallbackProgress: 89,
    fallbackStatus: "blocked",
    fallbackAction: "Production gelée avant validation humaine",
  },
] as const;

const ZONE_OFFSETS: Record<SceneAgentBase["id"], [number, number, number]> = {
  atlas: [-0.22, 0, -0.1],
  pixel: [-0.18, 0, 0.16],
  forge: [0.24, 0, 0.02],
  sonar: [0.18, 0, -0.14],
  vega: [0.06, 0, 0.22],
};

export function taskToVisualStatus(task: Task | undefined, runtime: AgentStatus | undefined): VisualStatus {
  if (task?.error || task?.revisionNote) return "blocked";
  if (task?.status === "review") return "review";
  if (task?.status === "done") return "done";
  if (task && task.status !== "backlog") return "working";
  if (runtime === "working" || runtime === "walking" || runtime === "returning") return "working";
  return "idle";
}

export function taskPriority(status: TaskStatus): number {
  return {
    in_progress: 0,
    assigned: 1,
    review: 2,
    backlog: 3,
    done: 4,
  }[status];
}

export function zoneForTask(base: SceneAgentBase, task: Task | undefined, status: VisualStatus): SceneZoneId {
  if (status === "blocked") return base.id === "vega" ? "security" : "memory";
  if (task?.status === "review" || status === "review") return "review";
  if (task?.status === "done" || status === "done") return "deploy";

  const text = `${task?.title ?? ""} ${task?.description ?? ""} ${task?.tags?.join(" ") ?? ""}`.toLowerCase();
  if (/(review|validation|pr|checklist|audit)/.test(text)) return "review";
  if (/(test|qa|bug|recette|playwright|vitest|build)/.test(text)) return "qa";
  if (/(deploy|prod|vercel|release|publish|mise en ligne)/.test(text)) return "deploy";
  if (/(security|permission|auth|api key|clef|clé|secret|supabase)/.test(text)) return "security";
  if (/(memory|doc|contexte|knowledge|secret)/.test(text)) return "memory";
  if (/(code|component|ui|api|route|implément|implement|fix|terminal)/.test(text)) return "coding";
  if (/(plan|backlog|scope|roadmap|analyse|découpe|decoupe|calendar)/.test(text)) return "planning";
  return base.defaultZone;
}

export function targetForAgent(base: SceneAgentBase, zoneId: SceneZoneId): [number, number, number] {
  const zone = SCENE_ZONES[zoneId];
  const offset = ZONE_OFFSETS[base.id];
  return [
    zone.position[0] + offset[0],
    zone.position[1] - 0.05 + offset[1],
    zone.position[2] + offset[2],
  ];
}
