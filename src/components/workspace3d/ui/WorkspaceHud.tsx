"use client";

import { motion } from "framer-motion";
import { TASK_LABELS } from "@/systems/tasks";
import type { WorkspaceTask } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const TASKS: WorkspaceTask[] = ["work", "plan", "secure", "review", "deploy"];

export function WorkspaceHud() {
  const objects = useWorkspaceStore((state) => state.objects);
  const agents = useWorkspaceStore((state) => state.agents);
  const selected = useWorkspaceStore((state) => state.selected);
  const statusMessage = useWorkspaceStore((state) => state.statusMessage);
  const assignTask = useWorkspaceStore((state) => state.assignTask);
  const selectedAgent = selected?.kind === "agent" ? agents.find((agent) => agent.id === selected.id) : null;
  const moving = agents.filter((agent) => agent.animationState === "walking").length;
  const active = agents.filter((agent) => agent.task !== "idle").length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto absolute top-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-white/70 bg-white/90 px-3.5 py-1.5 shadow-lg shadow-slate-950/10 backdrop-blur-sm md:left-1/2 md:-translate-x-1/2 md:px-4 md:py-2"
      >
        <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 sm:inline">AI Workspace</span>
        <span className="hidden h-4 w-px bg-slate-200 sm:inline" />
        <span className="text-xs font-semibold text-slate-700">{objects.length} objets</span>
        <span className="text-xs font-semibold text-slate-700">{agents.length} agents</span>
        <span className="text-xs font-semibold text-cyan-700">{moving} en route</span>
        <span className="text-xs font-semibold text-emerald-700">{active} actifs</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto absolute bottom-4 left-1/2 z-20 hidden w-[min(720px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-2xl shadow-slate-950/12 backdrop-blur-sm md:block"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="min-w-0 text-sm font-medium text-slate-700">{statusMessage}</p>
          <div className="flex flex-wrap gap-2">
            {TASKS.map((task) => (
              <button
                key={task}
                type="button"
                disabled={!selectedAgent}
                onClick={() => selectedAgent && assignTask(selectedAgent.id, task)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition enabled:hover:border-cyan-300 enabled:hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {TASK_LABELS[task]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
