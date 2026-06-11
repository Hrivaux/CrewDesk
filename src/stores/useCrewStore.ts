"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActivityEvent,
  ActivityKind,
  AgentId,
  AgentRuntime,
  Celebration,
  ChatMessage,
  DispatchFx,
  Plan,
  Project,
  Task,
  TaskStatus,
} from "@/services/types";
import { AGENT_BY_ID, agentRender, initialRuntime } from "@/lib/agents";
import { pathBetween, walkDuration } from "@/lib/iso";
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
  completedTotal: number;

  /* --- Chat avec Atlas --- */
  chatMessages: ChatMessage[];
  /** Atlas analyse la demande (indicateur de frappe). */
  planning: boolean;
  /** Plan proposé, en attente de validation/édition. */
  pendingPlan: Plan | null;

  addChatMessage: (msg: Omit<ChatMessage, "id" | "at">) => void;
  setPlanning: (planning: boolean) => void;
  setPendingPlan: (plan: Plan | null) => void;
  reassignPendingTask: (index: number, agentId: AgentId) => void;
  updatePendingTaskTitle: (index: number, title: string) => void;
  removePendingTask: (index: number) => void;
  /** Création unitaire par Atlas (pipeline de validation du plan). */
  addTask: (task: Task) => void;

  seedTasks: (tasks: Task[]) => void;
  seedProjects: (projects: Project[]) => void;
  /** Atlas assigne : la carte passe en "assigned", l'agent part vers son poste. */
  dispatchTask: (taskId: string) => void;
  /** L'agent est arrivé à son poste : la tâche démarre. */
  beginWork: (agentId: AgentId) => void;
  setTaskProgress: (taskId: string, progress: number) => void;
  /** Travail achevé : la carte part en revue, l'agent rentre en zone pause. */
  sendToReview: (taskId: string) => void;
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
      completedTotal: 0,
      chatMessages: [],
      planning: false,
      pendingPlan: null,

      addChatMessage: (msg) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            { ...msg, id: uid("msg"), at: Date.now() },
          ].slice(-40),
        })),

      setPlanning: (planning) => set({ planning }),

      setPendingPlan: (plan) => set({ pendingPlan: plan }),

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

      seedTasks: (tasks) =>
        set((s) => ({
          tasks: [...s.tasks, ...tasks],
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

      sendToReview: (taskId) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const rt = s.agents[task.agentId];
        const def = AGENT_BY_ID[task.agentId];
        const releasing = rt.taskId === taskId;
        set({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: "review", progress: 100, reviewAt: Date.now() }
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
      partialize: (s) => ({
        tasks: s.tasks,
        projects: s.projects,
        activity: s.activity,
        chatMessages: s.chatMessages,
        completedTotal: s.completedTotal,
      }),
      // Au rechargement : les tâches en cours retournent en backlog pour être redistribuées.
      merge: (persisted, current) => {
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
        };
      },
    },
  ),
);
