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
        className="pointer-events-auto absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/70 bg-white/82 px-4 py-2 shadow-xl shadow-slate-950/10 backdrop-blur-xl"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">AI Workspace</span>
        <span className="h-4 w-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-700">{objects.length} objects</span>
        <span className="text-xs font-semibold text-slate-700">{agents.length} agents</span>
        <span className="text-xs font-semibold text-cyan-700">{moving} moving</span>
        <span className="text-xs font-semibold text-emerald-700">{active} active</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[min(720px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/84 p-3 shadow-2xl shadow-slate-950/12 backdrop-blur-xl"
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
