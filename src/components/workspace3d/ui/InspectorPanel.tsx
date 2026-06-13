"use client";

import { motion } from "framer-motion";
import type { EyeShape, WorkspaceTask } from "@/types/workspace";
import { OBJECT_DEFINITIONS } from "@/systems/collisions";
import { TASK_DESCRIPTIONS, TASK_LABELS } from "@/systems/tasks";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const EYE_SHAPES: EyeShape[] = ["normal", "happy", "focused", "sleepy", "alert"];
const TASKS: WorkspaceTask[] = ["idle", "work", "plan", "secure", "review", "deploy"];
const COLOR_SWATCHES = ["#38bdf8", "#f97316", "#22c55e", "#8b5cf6", "#eab308", "#fb7185"];

export function InspectorPanel() {
  const selected = useWorkspaceStore((state) => state.selected);
  const objects = useWorkspaceStore((state) => state.objects);
  const agents = useWorkspaceStore((state) => state.agents);
  const rotateObject = useWorkspaceStore((state) => state.rotateObject);
  const deleteObject = useWorkspaceStore((state) => state.deleteObject);
  const updateAgent = useWorkspaceStore((state) => state.updateAgent);
  const assignTask = useWorkspaceStore((state) => state.assignTask);

  const object = selected?.kind === "object" ? objects.find((candidate) => candidate.id === selected.id) : null;
  const agent = selected?.kind === "agent" ? agents.find((candidate) => candidate.id === selected.id) : null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="pointer-events-auto flex h-full min-h-0 w-64 flex-col rounded-[20px] border border-white/10 bg-slate-950/92 p-4 text-white shadow-[0_18px_70px_rgba(2,6,23,0.4)] backdrop-blur-sm md:w-80"
    >
      <div className="border-b border-white/10 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Inspector</p>
        <h2 className="mt-1 text-lg font-semibold">{object ? OBJECT_DEFINITIONS[object.type].label : agent ? agent.name : "Nothing selected"}</h2>
      </div>

      {!object && !agent ? (
        <div className="flex flex-1 items-center justify-center text-center text-sm leading-relaxed text-slate-400">
          Select an object or agent to edit properties, rotate objects, customize eyes, or assign a task.
        </div>
      ) : null}

      {object ? (
        <div className="space-y-4 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Purpose</p>
            <p className="mt-1 text-sm text-slate-300">{OBJECT_DEFINITIONS[object.type].purpose}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => rotateObject(object.id, -1)} className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-slate-100">
              Rotate left
            </button>
            <button type="button" onClick={() => rotateObject(object.id, 1)} className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-slate-100">
              Rotate right
            </button>
          </div>
          <button type="button" onClick={() => deleteObject(object.id)} className="w-full rounded-xl bg-rose-500/90 px-3 py-2 text-xs font-semibold text-white">
            Delete object
          </button>
        </div>
      ) : null}

      {agent ? (
        <div className="thin-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pt-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</span>
            <input
              value={agent.name}
              onChange={(event) => updateAgent(agent.id, { name: event.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white outline-none ring-cyan-300/40 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</span>
            <input
              value={agent.role}
              onChange={(event) => updateAgent(agent.id, { role: event.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white outline-none ring-cyan-300/40 focus:ring-2"
            />
          </label>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Body color</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateAgent(agent.id, { color })}
                  className="h-8 w-8 rounded-full border border-white/20"
                  style={{ background: color, boxShadow: agent.color === color ? "0 0 0 3px rgba(255,255,255,0.85)" : undefined }}
                  aria-label={`Set color ${color}`}
                />
              ))}
              <input
                type="color"
                value={agent.color}
                onChange={(event) => updateAgent(agent.id, { color: event.target.value })}
                className="h-8 w-10 rounded-lg border border-white/10 bg-transparent"
                aria-label="Custom color"
              />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Eye shape</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EYE_SHAPES.map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => updateAgent(agent.id, { eyeShape: shape })}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold capitalize",
                    agent.eyeShape === shape ? "border-cyan-300 bg-cyan-300/18 text-cyan-100" : "border-white/10 bg-white/8 text-slate-300",
                  ].join(" ")}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assign task</span>
            <div className="mt-2 space-y-2">
              {TASKS.map((task) => (
                <button
                  key={task}
                  type="button"
                  onClick={() => assignTask(agent.id, task)}
                  className={[
                    "w-full rounded-xl border px-3 py-2 text-left transition",
                    agent.task === task ? "border-cyan-300 bg-cyan-300/18" : "border-white/10 bg-white/8 hover:bg-white/12",
                  ].join(" ")}
                >
                  <span className="block text-xs font-semibold text-white">{TASK_LABELS[task]}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{TASK_DESCRIPTIONS[task]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </motion.aside>
  );
}
