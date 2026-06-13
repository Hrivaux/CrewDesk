"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { TASK_DESCRIPTIONS, TASK_LABELS } from "@/systems/tasks";
import type { WorkspaceTask } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const TASKS: WorkspaceTask[] = ["idle", "work", "plan", "secure", "review", "deploy"];

/**
 * Read-only orchestrator on the Scène page: pick an agent and hand it a task.
 * Responsive — a docked side panel on desktop, a collapsible bottom sheet on
 * mobile so the 3D scene stays visible.
 */
export function OrchestratorPanel() {
  const agents = useWorkspaceStore((state) => state.agents);
  const selected = useWorkspaceStore((state) => state.selected);
  const selectAgent = useWorkspaceStore((state) => state.selectAgent);
  const assignTask = useWorkspaceStore((state) => state.assignTask);
  const selectedAgent = selected?.kind === "agent" ? agents.find((agent) => agent.id === selected.id) : null;
  const [open, setOpen] = useState(false);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="pointer-events-auto absolute z-20 flex flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-sm inset-x-2 bottom-2 max-h-[58dvh] md:inset-x-auto md:top-4 md:right-4 md:bottom-4 md:w-80 md:max-h-none"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex shrink-0 items-center gap-2 border-b border-slate-200/80 p-3 text-left md:cursor-default"
      >
        <span className="flex flex-1 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Orchestrateur</span>
          <span className="text-base font-semibold text-slate-950">Votre équipe</span>
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{agents.length}</span>
        <span className={`text-slate-400 transition-transform md:hidden ${open ? "rotate-180" : ""}`} aria-hidden>
          ▴
        </span>
      </button>

      <div className={`min-h-0 flex-1 flex-col ${open ? "flex" : "hidden"} md:flex`}>
        <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {agents.map((agent) => {
            const active = selectedAgent?.id === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => selectAgent(agent.id)}
                className={[
                  "w-full rounded-xl border p-2.5 text-left transition",
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
              </button>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-slate-200/80 p-3">
          {selectedAgent ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tâche · {selectedAgent.name}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {TASKS.map((task) => (
                  <button
                    key={task}
                    type="button"
                    onClick={() => assignTask(selectedAgent.id, task)}
                    title={TASK_DESCRIPTIONS[task]}
                    className={[
                      "rounded-lg border px-2 py-1.5 text-xs font-semibold transition",
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
            <p className="text-center text-xs text-slate-400">Touchez un agent pour lui donner une tâche.</p>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
