"use client";

import { useEffect, useRef } from "react";
import { useCrewStore } from "@/stores/useCrewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { AgentId, Task } from "@/services/types";
import type { WorkspaceTask } from "@/types/workspace";

/** Specialists rendered on the board (Atlas orchestrates from the chat). */
const SPECIALIST_IDS: AgentId[] = ["pixel", "forge", "sonar", "plume", "vega"];

/** Station each specialist heads to when its task type is ambiguous. */
const DEFAULT_STATION: Record<string, WorkspaceTask> = {
  pixel: "work",
  forge: "work",
  sonar: "review",
  plume: "plan",
  vega: "deploy",
};

/** Map a crew task (title + description + tags) to a board station/task. */
function stationForTask(task: Task, fallback: WorkspaceTask): WorkspaceTask {
  const text = `${task.title} ${task.description} ${task.tags.join(" ")}`.toLowerCase();
  if (/(security|sécur|auth|secret|permission|credential|clé api|token)/.test(text)) return "secure";
  if (/(deploy|prod|vercel|release|publish|mise en ligne|déploie|build|ci\/cd|rollback)/.test(text)) return "deploy";
  if (/(review|validation|\bpr\b|checklist|audit|relecture|qa|test|recette)/.test(text)) return "review";
  if (/(plan|backlog|scope|roadmap|recherche|analyse|étude|découpe|research|persona)/.test(text)) return "plan";
  if (/(code|component|composant|\bui\b|\bapi\b|route|implément|fix|bug|front|back|dev|design)/.test(text)) return "work";
  return fallback;
}

/**
 * Bridges the orchestrator (useCrewStore) onto the Blender board: whenever
 * Atlas puts a specialist to work, the matching robot walks to the right
 * station and plays its animation. Idle agents idle. One-way sync — reads the
 * crew store, drives the workspace store — so there is no update loop.
 */
export function CrewBridge() {
  const crewAgents = useCrewStore((state) => state.agents);
  const tasks = useCrewStore((state) => state.tasks);
  const assignTask = useWorkspaceStore((state) => state.assignTask);
  const applied = useRef<Record<string, WorkspaceTask>>({});

  useEffect(() => {
    for (const id of SPECIALIST_IDS) {
      const runtime = crewAgents[id];
      if (!runtime) continue;

      const active = tasks.find((task) => task.agentId === id && task.status === "in_progress");
      const pending =
        active ??
        tasks.find((task) => task.agentId === id && (task.status === "assigned" || task.status === "review"));

      let desired: WorkspaceTask;
      const busy = runtime.status === "working" || runtime.status === "walking" || runtime.status === "returning";
      if (busy && pending) {
        desired = stationForTask(pending, DEFAULT_STATION[id] ?? "work");
      } else {
        desired = "idle";
      }

      if (applied.current[id] !== desired) {
        applied.current[id] = desired;
        assignTask(id, desired);
      }
    }
  }, [crewAgents, tasks, assignTask]);

  return null;
}
