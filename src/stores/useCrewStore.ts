"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActivityEvent,
  ActivityKind,
  AgentId,
  AgentRuntime,
  DispatchFx,
  Task,
} from "@/services/types";
import { AGENT_BY_ID, agentRender, initialRuntime } from "@/lib/agents";
import { pathBetween, walkDuration } from "@/lib/iso";

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export interface CrewState {
  agents: Record<AgentId, AgentRuntime>;
  tasks: Task[];
  activity: ActivityEvent[];
  dispatchesFx: DispatchFx[];
  selectedAgent: AgentId | null;
  completedTotal: number;

  seedTasks: (tasks: Task[]) => void;
  /** Atlas assigne : la carte passe en "assigned", l'agent part vers son poste. */
  dispatchTask: (taskId: string) => void;
  /** L'agent est arrivé à son poste : la tâche démarre. */
  beginWork: (agentId: AgentId) => void;
  setTaskProgress: (taskId: string, progress: number) => void;
  /** Tâche terminée : l'agent repart vers la zone pause. */
  finishTask: (taskId: string) => void;
  /** Fin du trajet retour. */
  settleAgent: (agentId: AgentId) => void;
  selectAgent: (id: AgentId | null) => void;
  removeDispatchFx: (id: string) => void;
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

export const useCrewStore = create<CrewState>()(
  persist(
    (set, get) => ({
      agents: initialRuntime(),
      tasks: [],
      activity: [],
      dispatchesFx: [],
      selectedAgent: null,
      completedTotal: 0,

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

      dispatchTask: (taskId) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || task.status !== "backlog") return;
        const rt = s.agents[task.agentId];
        const def = AGENT_BY_ID[task.agentId];
        if (rt.status !== "idle") return;

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
          activity: pushActivity(
            s.activity,
            "dispatch",
            `Atlas a assigné « ${task.title} » à ${def.name}`,
            task.agentId,
          ),
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

      finishTask: (taskId) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const rt = s.agents[task.agentId];
        const def = AGENT_BY_ID[task.agentId];
        const path = pathBetween(def.workSpot, def.idleSpot);
        set({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "done", progress: 100, completedAt: Date.now() } : t,
          ),
          agents: {
            ...s.agents,
            [task.agentId]: {
              ...rt,
              status: "returning",
              taskId: null,
              pose: { path, startedAt: Date.now(), duration: walkDuration(path) },
            },
          },
          completedTotal: s.completedTotal + 1,
          activity: pushActivity(
            s.activity,
            "done",
            `${def.name} a terminé « ${task.title} » ✓`,
            task.agentId,
          ),
        });
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

      removeDispatchFx: (id) =>
        set((s) => ({ dispatchesFx: s.dispatchesFx.filter((d) => d.id !== id) })),

      log: (kind, message, agentId = null) =>
        set((s) => ({ activity: pushActivity(s.activity, kind, message, agentId) })),
    }),
    {
      name: "crewdesk-v1",
      storage: createJSONStorage(() => localStorage),
      // On ne persiste que les données métier ; l'état runtime des agents repart propre.
      partialize: (s) => ({
        tasks: s.tasks,
        activity: s.activity,
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
          activity: p.activity ?? [],
          completedTotal: p.completedTotal ?? 0,
        };
      },
    },
  ),
);
