"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActivityEvent,
  ActivityKind,
  AgentId,
  AgentRuntime,
  AgentSkill,
  AgentStats,
  Celebration,
  ChatMessage,
  DispatchFx,
  Plan,
  Project,
  ScenePhase,
  Task,
  TaskStatus,
  TaskUsage,
  Toast,
} from "@/services/types";
import { AGENTS, AGENT_BY_ID, agentRender, breakSpot, initialRuntime } from "@/lib/agents";
import { pathBetween, walkDuration } from "@/lib/iso";
import { levelFromXp } from "@/lib/xp";
import type { Pose } from "@/services/types";

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export interface CrewState {
  agents: Record<AgentId, AgentRuntime>;
  tasks: Task[];
  projects: Project[];
  activity: ActivityEvent[];
  dispatchesFx: DispatchFx[];
  celebrations: Celebration[];
  selectedAgent: AgentId | null;
  /** Agent mis en évidence par survol (carte kanban ↔ sprite de la scène). */
  hoveredAgent: AgentId | null;
  /** Tâche ouverte dans le panneau de détail (livrable, description). */
  selectedTask: string | null;
  /** Vrai quand la clé API est configurée : les agents travaillent réellement. */
  liveMode: boolean;
  /** Dossier de base des projets sur le disque (mode live). */
  workspaceBase: string | null;
  /** Consommation API cumulée (tokens et $) et budget utilisateur. */
  spend: { inputTokens: number; outputTokens: number; costUSD: number };
  budgetUSD: number | null;
  completedTotal: number;

  addSpend: (usage: TaskUsage) => void;
  addTaskUsage: (taskId: string, usage: TaskUsage) => void;
  setBudgetUSD: (value: number | null) => void;
  resetSpend: () => void;

  /* --- Chat avec Atlas --- */
  chatMessages: ChatMessage[];
  /** Atlas analyse la demande (indicateur de frappe). */
  planning: boolean;
  /** Plan proposé, en attente de validation/édition. */
  pendingPlan: Plan | null;
  /** Compteur d'ondes de commandement d'Atlas (validation de plan). */
  atlasBurst: number;

  /* --- Entraînement des agents (skills & connaissances) --- */
  skills: AgentSkill[];
  /** Agent dont le panneau d'entraînement est ouvert. */
  trainingAgent: AgentId | null;

  addSkill: (
    skill: Omit<AgentSkill, "id" | "createdAt" | "updatedAt" | "enabled">,
  ) => void;
  updateSkill: (
    id: string,
    patch: Partial<Pick<AgentSkill, "name" | "description" | "content" | "kind">>,
  ) => void;
  toggleSkill: (id: string) => void;
  removeSkill: (id: string) => void;
  setTrainingAgent: (id: AgentId | null) => void;

  /* --- Progression, notifications, ambiance --- */
  agentStats: Record<AgentId, AgentStats>;
  toasts: Toast[];
  /** Atlas fait les cent pas quand la file d'attente grossit. */
  queuePressure: boolean;
  scenePhase: ScenePhase;
  sceneTheme: string;
  onboardingDone: boolean;
  /* --- État UI partagé (command palette, panneaux) --- */
  chatOpen: boolean;
  boardOverlayOpen: boolean;
  replayOpen: boolean;

  pushToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  setQueuePressure: (pressure: boolean) => void;
  setScenePhase: (phase: ScenePhase) => void;
  setOnboardingDone: () => void;
  setChatOpen: (open: boolean) => void;
  setBoardOverlayOpen: (open: boolean) => void;
  setReplayOpen: (open: boolean) => void;
  /** Pause café : trajet vers la machine, pause, puis retour. */
  sendToBreak: (agentId: AgentId) => void;
  startBreak: (agentId: AgentId) => void;
  endBreak: (agentId: AgentId) => void;

  addChatMessage: (msg: Omit<ChatMessage, "id" | "at">) => void;
  setPlanning: (planning: boolean) => void;
  setPendingPlan: (plan: Plan | null) => void;
  pulseAtlas: () => void;
  reassignPendingTask: (index: number, agentId: AgentId) => void;
  updatePendingTaskTitle: (index: number, title: string) => void;
  removePendingTask: (index: number) => void;
  /** Création unitaire par Atlas (pipeline de validation du plan). */
  addTask: (task: Task) => void;
  /** Création manuelle d'une tâche au backlog (depuis le board). */
  createTask: (input: {
    title: string;
    description: string;
    agentId: AgentId;
    estimateMin: number;
    tags: string[];
    projectId?: string;
  }) => void;

  seedTasks: (tasks: Task[]) => void;
  seedProjects: (projects: Project[]) => void;
  /** Atlas assigne : la carte passe en "assigned", l'agent part vers son poste. */
  dispatchTask: (taskId: string) => void;
  /** L'agent est arrivé à son poste : la tâche démarre. */
  beginWork: (agentId: AgentId) => void;
  setTaskProgress: (taskId: string, progress: number) => void;
  /** Travail achevé : la carte part en revue, l'agent rentre en zone pause. */
  sendToReview: (taskId: string, deliverable?: string, files?: string[]) => void;
  /** Échec d'exécution (live) : la carte retourne au backlog, l'agent rentre. */
  failTask: (taskId: string, message: string) => void;
  /** Retouche : l'agent reprend son travail avec le retour de l'utilisateur. */
  requestRevision: (taskId: string, feedback: string) => void;
  setSelectedTask: (id: string | null) => void;
  /** Projet ouvert dans l'aperçu (iframe). */
  previewProject: string | null;
  setPreviewProject: (id: string | null) => void;
  setLiveMode: (live: boolean) => void;
  setWorkspaceBase: (base: string | null) => void;
  /** Atlas valide la revue : carte « Terminé » + confettis. */
  approveTask: (taskId: string) => void;
  /** Déplacement manuel d'une carte (drag & drop) avec effets sur la scène. */
  moveTask: (taskId: string, to: TaskStatus) => void;
  /** Fin du trajet retour. */
  settleAgent: (agentId: AgentId) => void;
  selectAgent: (id: AgentId | null) => void;
  setHoveredAgent: (id: AgentId | null) => void;
  removeDispatchFx: (id: string) => void;
  removeCelebration: (id: string) => void;
  log: (kind: ActivityKind, message: string, agentId?: AgentId | null) => void;
}

function pushActivity(
  activity: ActivityEvent[],
  kind: ActivityKind,
  message: string,
  agentId: AgentId | null,
): ActivityEvent[] {
  const event: ActivityEvent = { id: uid("evt"), at: Date.now(), kind, agentId, message };
  return [event, ...activity].slice(0, 60);
}

/** Pose de retour : depuis la position courante vers la zone pause. */
function returnPose(rt: AgentRuntime, agentId: AgentId): Pose {
  const def = AGENT_BY_ID[agentId];
  const from = agentRender(rt, def, Date.now()).pos;
  const path = pathBetween(from, def.idleSpot);
  return { path, startedAt: Date.now(), duration: walkDuration(path) };
}

function celebrationFor(task: Task): Celebration {
  return { id: uid("fete"), taskId: task.id, color: AGENT_BY_ID[task.agentId].color };
}

/** Borne l'historique : garde les 60 dernières tâches terminées. */
function trimDone(tasks: Task[]): Task[] {
  const done = tasks.filter((t) => t.status === "done");
  if (done.length <= 60) return tasks;
  const cutoff = done
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 60);
  const keep = new Set(cutoff.map((t) => t.id));
  return tasks.filter((t) => t.status !== "done" || keep.has(t.id));
}

function initialStats(): Record<AgentId, AgentStats> {
  return Object.fromEntries(
    AGENTS.map((a) => [a.id, { xp: 0, done: 0, history: [] as AgentStats["history"] }]),
  ) as Record<AgentId, AgentStats>;
}

/** XP, historique et toasts à la complétion d'une tâche (+ niveau éventuel). */
function completionUpdates(
  s: CrewState,
  task: Task,
): Pick<CrewState, "agentStats" | "toasts"> {
  const def = AGENT_BY_ID[task.agentId];
  const stats = s.agentStats[task.agentId];
  const before = levelFromXp(stats.xp);
  const xp = stats.xp + Math.max(5, Math.round(task.estimateMin));
  const after = levelFromXp(xp);

  const toasts: Toast[] = [
    ...s.toasts,
    {
      id: uid("toast"),
      title: `${def.name} a terminé`,
      message: `${task.title} ✓`,
      color: def.color,
    },
  ];
  if (after > before) {
    toasts.push({
      id: uid("toast"),
      title: `${def.name} passe niveau ${after} ✦`,
      message: def.personality,
      color: def.color,
    });
  }

  return {
    agentStats: {
      ...s.agentStats,
      [task.agentId]: {
        xp,
        done: stats.done + 1,
        history: [
          { taskId: task.id, title: task.title, at: Date.now(), tags: [...task.tags] },
          ...stats.history,
        ].slice(0, 10),
      },
    },
    toasts: toasts.slice(-4),
  };
}

export const useCrewStore = create<CrewState>()(
  persist(
    (set, get) => ({
      agents: initialRuntime(),
      tasks: [],
      projects: [],
      activity: [],
      dispatchesFx: [],
      celebrations: [],
      selectedAgent: null,
      hoveredAgent: null,
      selectedTask: null,
      previewProject: null,
      liveMode: false,
      workspaceBase: null,
      spend: { inputTokens: 0, outputTokens: 0, costUSD: 0 },
      budgetUSD: null,
      completedTotal: 0,

      addSpend: (usage) =>
        set((s) => ({
          spend: {
            inputTokens: s.spend.inputTokens + usage.inputTokens,
            outputTokens: s.spend.outputTokens + usage.outputTokens,
            costUSD: Math.round((s.spend.costUSD + usage.costUSD) * 10_000) / 10_000,
          },
        })),

      addTaskUsage: (taskId, usage) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  usage: {
                    inputTokens: (t.usage?.inputTokens ?? 0) + usage.inputTokens,
                    outputTokens: (t.usage?.outputTokens ?? 0) + usage.outputTokens,
                    costUSD:
                      Math.round(((t.usage?.costUSD ?? 0) + usage.costUSD) * 10_000) /
                      10_000,
                  },
                }
              : t,
          ),
        })),

      setBudgetUSD: (budgetUSD) => set({ budgetUSD }),

      resetSpend: () =>
        set({ spend: { inputTokens: 0, outputTokens: 0, costUSD: 0 } }),
      chatMessages: [],
      planning: false,
      pendingPlan: null,
      atlasBurst: 0,
      skills: [],
      trainingAgent: null,

      addSkill: (skill) =>
        set((s) => ({
          skills: [
            ...s.skills,
            {
              ...skill,
              id: uid("skill"),
              enabled: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateSkill: (id, patch) =>
        set((s) => ({
          skills: s.skills.map((sk) =>
            sk.id === id ? { ...sk, ...patch, updatedAt: Date.now() } : sk,
          ),
        })),

      toggleSkill: (id) =>
        set((s) => ({
          skills: s.skills.map((sk) =>
            sk.id === id ? { ...sk, enabled: !sk.enabled, updatedAt: Date.now() } : sk,
          ),
        })),

      removeSkill: (id) =>
        set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) })),

      setTrainingAgent: (trainingAgent) => set({ trainingAgent }),

      agentStats: initialStats(),
      toasts: [],
      queuePressure: false,
      scenePhase: "day",
      sceneTheme: "mission-control",
      onboardingDone: false,
      chatOpen: false,
      boardOverlayOpen: false,
      replayOpen: false,

      pushToast: (toast) =>
        set((s) => ({ toasts: [...s.toasts, { ...toast, id: uid("toast") }].slice(-4) })),

      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      setQueuePressure: (queuePressure) => {
        if (get().queuePressure !== queuePressure) set({ queuePressure });
      },

      setScenePhase: (scenePhase) => set({ scenePhase }),

      setOnboardingDone: () => set({ onboardingDone: true }),

      setChatOpen: (chatOpen) => set({ chatOpen }),

      setBoardOverlayOpen: (boardOverlayOpen) => set({ boardOverlayOpen }),

      setReplayOpen: (replayOpen) => set({ replayOpen }),

      sendToBreak: (agentId) => {
        const s = get();
        const rt = s.agents[agentId];
        if (rt.status !== "idle" || rt.taskId) return;
        const def = AGENT_BY_ID[agentId];
        const from = agentRender(rt, def, Date.now()).pos;
        const path = pathBetween(from, breakSpot(def));
        set({
          agents: {
            ...s.agents,
            [agentId]: {
              ...rt,
              status: "walking",
              pose: { path, startedAt: Date.now(), duration: walkDuration(path) },
            },
          },
        });
      },

      startBreak: (agentId) => {
        const s = get();
        const rt = s.agents[agentId];
        if (rt.status !== "walking" || rt.taskId) return;
        set({
          agents: {
            ...s.agents,
            [agentId]: {
              ...rt,
              status: "break",
              pose: null,
              breakUntil: Date.now() + 4200 + Math.random() * 2800,
            },
          },
        });
      },

      endBreak: (agentId) => {
        const s = get();
        const rt = s.agents[agentId];
        if (rt.status !== "break") return;
        set({
          agents: {
            ...s.agents,
            [agentId]: {
              ...rt,
              status: "returning",
              breakUntil: undefined,
              pose: returnPose(rt, agentId),
            },
          },
        });
      },

      addChatMessage: (msg) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            { ...msg, id: uid("msg"), at: Date.now() },
          ].slice(-40),
        })),

      setPlanning: (planning) => set({ planning }),

      setPendingPlan: (plan) => set({ pendingPlan: plan }),

      pulseAtlas: () => set((s) => ({ atlasBurst: s.atlasBurst + 1 })),

      reassignPendingTask: (index, agentId) =>
        set((s) => {
          if (!s.pendingPlan) return s;
          return {
            pendingPlan: {
              ...s.pendingPlan,
              tasks: s.pendingPlan.tasks.map((t, i) =>
                i === index ? { ...t, agentId } : t,
              ),
            },
          };
        }),

      updatePendingTaskTitle: (index, title) =>
        set((s) => {
          if (!s.pendingPlan || title.trim() === "") return s;
          return {
            pendingPlan: {
              ...s.pendingPlan,
              tasks: s.pendingPlan.tasks.map((t, i) =>
                i === index ? { ...t, title: title.trim() } : t,
              ),
            },
          };
        }),

      removePendingTask: (index) =>
        set((s) => {
          if (!s.pendingPlan) return s;
          const tasks = s.pendingPlan.tasks
            .filter((_, i) => i !== index)
            // Réindexe les dépendances après suppression.
            .map((t) => ({
              ...t,
              dependsOn: t.dependsOn
                ?.filter((d) => d !== index)
                .map((d) => (d > index ? d - 1 : d)),
            }));
          return { pendingPlan: { ...s.pendingPlan, tasks } };
        }),

      addTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, task],
          activity: pushActivity(
            s.activity,
            "system",
            `Atlas a créé « ${task.title} »`,
            task.agentId,
          ),
        })),

      createTask: (input) =>
        set((s) => {
          // Source « live » seulement si rattachée à un projet avec dossier
          // (sinon elle ne sera pas exécutée automatiquement en mode live).
          const project = input.projectId
            ? s.projects.find((p) => p.id === input.projectId)
            : undefined;
          const task: Task = {
            id: uid("task"),
            title: input.title.trim(),
            description: input.description.trim(),
            agentId: input.agentId,
            status: "backlog",
            progress: 0,
            estimateMin: Math.max(1, Math.round(input.estimateMin)),
            tags: input.tags.slice(0, 3),
            projectId: input.projectId,
            source: project?.dir ? "live" : "sim",
            createdAt: Date.now(),
          };
          return {
            tasks: [...s.tasks, task],
            activity: pushActivity(
              s.activity,
              "system",
              `Nouvelle tâche « ${task.title} » pour ${AGENT_BY_ID[task.agentId].name}`,
              task.agentId,
            ),
          };
        }),

      seedTasks: (tasks) =>
        set((s) => ({
          tasks: trimDone([...s.tasks, ...tasks]),
          activity: pushActivity(
            s.activity,
            "system",
            `${tasks.length} nouvelles tâches ajoutées au backlog`,
            null,
          ),
        })),

      seedProjects: (projects) => set((s) => ({ projects: [...s.projects, ...projects] })),

      dispatchTask: (taskId) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || (task.status !== "backlog" && task.status !== "assigned")) return;
        const rt = s.agents[task.agentId];
        const def = AGENT_BY_ID[task.agentId];
        if (rt.status !== "idle" || rt.taskId) return;

        const from = agentRender(rt, def, Date.now()).pos;
        const path = pathBetween(from, def.workSpot);
        const fx: DispatchFx = {
          id: uid("fx"),
          to: task.agentId,
          color: def.color,
          taskTitle: task.title,
        };
        set({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: "assigned" } : t)),
          agents: {
            ...s.agents,
            [task.agentId]: {
              ...rt,
              status: "walking",
              taskId,
              pose: { path, startedAt: Date.now(), duration: walkDuration(path) },
            },
          },
          dispatchesFx: [...s.dispatchesFx, fx],
          activity:
            task.status === "backlog"
              ? pushActivity(
                  s.activity,
                  "dispatch",
                  `Atlas a assigné « ${task.title} » à ${def.name}`,
                  task.agentId,
                )
              : s.activity,
        });
      },

      beginWork: (agentId) => {
        const s = get();
        const rt = s.agents[agentId];
        if (rt.status !== "walking" || !rt.taskId) return;
        const task = s.tasks.find((t) => t.id === rt.taskId);
        const def = AGENT_BY_ID[agentId];
        set({
          agents: { ...s.agents, [agentId]: { ...rt, status: "working", pose: null } },
          tasks: s.tasks.map((t) =>
            t.id === rt.taskId ? { ...t, status: "in_progress", startedAt: Date.now() } : t,
          ),
          activity: task
            ? pushActivity(s.activity, "start", `${def.name} a commencé « ${task.title} »`, agentId)
            : s.activity,
        });
      },

      setTaskProgress: (taskId, progress) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, progress: Math.min(100, Math.round(progress)) } : t,
          ),
        })),

      sendToReview: (taskId, deliverable, files) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const rt = s.agents[task.agentId];
        const def = AGENT_BY_ID[task.agentId];
        const releasing = rt.taskId === taskId;
        set({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "review",
                  progress: 100,
                  reviewAt: Date.now(),
                  deliverable: deliverable ?? t.deliverable,
                  files: files ?? t.files,
                  revisionNote: undefined,
                  error: undefined,
                }
              : t,
          ),
          agents: releasing
            ? {
                ...s.agents,
                [task.agentId]: {
                  ...rt,
                  status: "returning",
                  taskId: null,
                  pose: returnPose(rt, task.agentId),
                },
              }
            : s.agents,
          activity: pushActivity(
            s.activity,
            "review",
            `${def.name} a terminé « ${task.title} » → revue`,
            task.agentId,
          ),
        });
      },

      approveTask: (taskId) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || task.status !== "review") return;
        set({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "done", progress: 100, completedAt: Date.now() } : t,
          ),
          completedTotal: s.completedTotal + 1,
          celebrations: [...s.celebrations, celebrationFor(task)].slice(-8),
          ...completionUpdates(s, task),
          activity: pushActivity(
            s.activity,
            "done",
            `Atlas a validé « ${task.title} » ✓`,
            task.agentId,
          ),
        });
      },

      moveTask: (taskId, to) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || task.status === to) return;
        const def = AGENT_BY_ID[task.agentId];
        const rt = s.agents[task.agentId];
        const wasActive = rt.taskId === taskId;
        const agentFree = rt.status === "idle" && !rt.taskId;

        /** Libère l'agent (trajet retour) s'il portait cette tâche. */
        const released: Record<AgentId, AgentRuntime> = wasActive
          ? {
              ...s.agents,
              [task.agentId]: {
                ...rt,
                status: "returning" as const,
                taskId: null,
                pose: returnPose(rt, task.agentId),
              },
            }
          : s.agents;

        /** Envoie l'agent travailler depuis sa position courante. */
        const walking = (): Record<AgentId, AgentRuntime> => {
          const from = agentRender(rt, def, Date.now()).pos;
          const path = pathBetween(from, def.workSpot);
          return {
            ...s.agents,
            [task.agentId]: {
              ...rt,
              status: "walking",
              taskId,
              pose: { path, startedAt: Date.now(), duration: walkDuration(path) },
            },
          };
        };

        switch (to) {
          case "backlog":
            set({
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: "backlog",
                      progress: 0,
                      startedAt: undefined,
                      reviewAt: undefined,
                      completedAt: undefined,
                    }
                  : t,
              ),
              agents: released,
              activity: pushActivity(
                s.activity,
                "system",
                `« ${task.title} » renvoyée au backlog`,
                task.agentId,
              ),
            });
            return;

          case "assigned":
          case "in_progress": {
            if (!agentFree && !wasActive) {
              // L'agent est occupé ailleurs : la carte attend en « Assigné ».
              set({
                tasks: s.tasks.map((t) =>
                  t.id === taskId ? { ...t, status: "assigned" } : t,
                ),
                activity: pushActivity(
                  s.activity,
                  "system",
                  `${def.name} est occupé — « ${task.title} » mise en file`,
                  task.agentId,
                ),
              });
              return;
            }
            if (wasActive && rt.status === "working") {
              // Déjà au poste : on ne change que la colonne.
              set({
                tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: to } : t)),
              });
              return;
            }
            const fx: DispatchFx = {
              id: uid("fx"),
              to: task.agentId,
              color: def.color,
              taskTitle: task.title,
            };
            set({
              tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: to } : t)),
              agents: walking(),
              dispatchesFx: [...s.dispatchesFx, fx],
              activity: pushActivity(
                s.activity,
                "dispatch",
                `« ${task.title} » assignée à ${def.name}`,
                task.agentId,
              ),
            });
            return;
          }

          case "review":
            set({
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: "review", progress: 100, reviewAt: Date.now() }
                  : t,
              ),
              agents: released,
              activity: pushActivity(
                s.activity,
                "review",
                `« ${task.title} » envoyée en revue`,
                task.agentId,
              ),
            });
            return;

          case "done":
            set({
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: "done", progress: 100, completedAt: Date.now() }
                  : t,
              ),
              agents: released,
              completedTotal: s.completedTotal + 1,
              celebrations: [...s.celebrations, celebrationFor(task)].slice(-8),
              ...completionUpdates(s, task),
              activity: pushActivity(
                s.activity,
                "done",
                `« ${task.title} » marquée terminée ✓`,
                task.agentId,
              ),
            });
            return;
        }
      },

      failTask: (taskId, message) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const rt = s.agents[task.agentId];
        const def = AGENT_BY_ID[task.agentId];
        const releasing = rt.taskId === taskId;
        set({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "backlog",
                  progress: 0,
                  startedAt: undefined,
                  attempts: (t.attempts ?? 0) + 1,
                  error: message,
                }
              : t,
          ),
          agents: releasing
            ? {
                ...s.agents,
                [task.agentId]: {
                  ...rt,
                  status: "returning",
                  taskId: null,
                  pose: returnPose(rt, task.agentId),
                },
              }
            : s.agents,
          toasts: [
            ...s.toasts,
            {
              id: uid("toast"),
              title: `Échec — ${def.name}`,
              message,
              color: "#FF8A4C",
            },
          ].slice(-4),
          activity: pushActivity(
            s.activity,
            "system",
            `Échec de « ${task.title} » : ${message}`,
            task.agentId,
          ),
        });
      },

      requestRevision: (taskId, feedback) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || !task.deliverable || feedback.trim() === "") return;
        const def = AGENT_BY_ID[task.agentId];
        set({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "assigned",
                  progress: 0,
                  revisionNote: feedback.trim(),
                  startedAt: undefined,
                  reviewAt: undefined,
                  completedAt: undefined,
                  error: undefined,
                }
              : t,
          ),
          activity: pushActivity(
            s.activity,
            "dispatch",
            `Retouche demandée à ${def.name} sur « ${task.title} »`,
            task.agentId,
          ),
        });
      },

      setSelectedTask: (id) => set({ selectedTask: id }),

      setPreviewProject: (previewProject) => set({ previewProject }),

      setLiveMode: (liveMode) => set({ liveMode }),

      setWorkspaceBase: (workspaceBase) => set({ workspaceBase }),

      settleAgent: (agentId) => {
        const s = get();
        const rt = s.agents[agentId];
        if (rt.status !== "returning") return;
        set({
          agents: { ...s.agents, [agentId]: { ...rt, status: "idle", pose: null } },
        });
      },

      selectAgent: (id) => set({ selectedAgent: id }),

      setHoveredAgent: (id) => set({ hoveredAgent: id }),

      removeDispatchFx: (id) =>
        set((s) => ({ dispatchesFx: s.dispatchesFx.filter((d) => d.id !== id) })),

      removeCelebration: (id) =>
        set((s) => ({ celebrations: s.celebrations.filter((c) => c.id !== id) })),

      log: (kind, message, agentId = null) =>
        set((s) => ({ activity: pushActivity(s.activity, kind, message, agentId) })),
    }),
    {
      name: "crewdesk-v1",
      storage: createJSONStorage(() => localStorage),
      // On ne persiste que les données métier ; l'état runtime des agents repart propre.
      partialize: persistedSlice,
      // Au rechargement : les tâches en cours retournent en backlog pour être redistribuées.
      merge: (persisted, current) => mergePersisted(persisted, current),
    },
  ),
);

/** Tranche métier persistée (localStorage et serveur partagent le même format). */
export function persistedSlice(s: CrewState): Partial<CrewState> {
  return {
    tasks: s.tasks,
    projects: s.projects,
    activity: s.activity,
    chatMessages: s.chatMessages,
    completedTotal: s.completedTotal,
    spend: s.spend,
    budgetUSD: s.budgetUSD,
    skills: s.skills,
    agentStats: s.agentStats,
    scenePhase: s.scenePhase,
    sceneTheme: s.sceneTheme,
    onboardingDone: s.onboardingDone,
  };
}

/** Fusionne une tranche persistée avec l'état courant (runtime agents préservé). */
export function mergePersisted(
  persisted: unknown,
  current: CrewState,
): CrewState {
  const p = (persisted ?? {}) as Partial<CrewState>;
  const tasks = (p.tasks ?? []).map((t) =>
    t.status === "assigned" || t.status === "in_progress"
      ? { ...t, status: "backlog" as const, progress: 0 }
      : t,
  );
  return {
    ...current,
    tasks,
    projects: p.projects ?? [],
    activity: p.activity ?? [],
    chatMessages: p.chatMessages ?? [],
    completedTotal: p.completedTotal ?? 0,
    spend: p.spend ?? { inputTokens: 0, outputTokens: 0, costUSD: 0 },
    budgetUSD: p.budgetUSD ?? null,
    skills: p.skills ?? [],
    agentStats: { ...initialStats(), ...(p.agentStats ?? {}) },
    scenePhase: p.scenePhase ?? "day",
    sceneTheme: p.sceneTheme ?? "mission-control",
    onboardingDone: p.onboardingDone ?? false,
  };
}

/** Applique un état venu du serveur par-dessus l'état courant. */
export function hydratePersisted(persisted: unknown): void {
  useCrewStore.setState((current) => mergePersisted(persisted, current));
}
