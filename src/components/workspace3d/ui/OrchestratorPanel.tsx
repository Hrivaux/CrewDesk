"use client";

import { motion } from "framer-motion";
import { TASK_DESCRIPTIONS, TASK_LABELS } from "@/systems/tasks";
import type { WorkspaceTask } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const TASKS: WorkspaceTask[] = ["idle", "work", "plan", "secure", "review", "deploy"];

/**
 * Read-only orchestrator on the Scène page: pick an agent and hand it a task.
 * The agent then walks to the matching Blender station and plays its
 * animation. No object editing here — that lives on the Configurer page.
 */
export function OrchestratorPanel() {
  const agents = useWorkspaceStore((state) => state.agents);
  const selected = useWorkspaceStore((state) => state.selected);
  const selectAgent = useWorkspaceStore((state) => state.selectAgent);
  const assignTask = useWorkspaceStore((state) => state.assignTask);
  const selectedAgent = selected?.kind === "agent" ? agents.find((agent) => agent.id === selected.id) : null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="pointer-events-auto flex h-full min-h-0 w-80 flex-col rounded-[22px] border border-white/70 bg-white/82 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl"
    >
      <div className="border-b border-slate-200/80 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Orchestrateur</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Votre équipe</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Choisissez un agent, donnez-lui une tâche : il rejoint la bonne station et se met au travail.
        </p>
      </div>

      <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto py-3 pr-1">
        {agents.map((agent) => {
          const active = selectedAgent?.id === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => selectAgent(agent.id)}
              className={[
                "w-full rounded-2xl border p-3 text-left transition",
                active
                  ? "border-cyan-300 bg-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                  : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white",
              ].join(" ")}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: agent.color }} />
                <span className="text-sm font-semibold text-slate-900">{agent.name}</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {TASK_LABELS[agent.task]}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{agent.message}</p>
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-200/80 pt-3">
        {selectedAgent ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tâche pour {selectedAgent.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TASKS.map((task) => (
                <button
                  key={task}
                  type="button"
                  onClick={() => assignTask(selectedAgent.id, task)}
                  title={TASK_DESCRIPTIONS[task]}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    selectedAgent.task === task
                      ? "border-cyan-300 bg-cyan-300/18 text-cyan-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700",
                  ].join(" ")}
                >
                  {TASK_LABELS[task]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400">Sélectionnez un agent pour lui assigner une tâche.</p>
        )}
      </div>
    </motion.aside>
  );
}
