"use client";

import { motion } from "framer-motion";
import { OBJECT_DEFINITIONS } from "@/systems/collisions";
import type { WorkspaceObjectType } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const OBJECT_ORDER: WorkspaceObjectType[] = [
  "desk",
  "whiteboard",
  "vault",
  "kanban",
  "server",
  "meeting",
  "plant",
  "lamp",
];

export function ObjectLibrary() {
  const placementType = useWorkspaceStore((state) => state.placementType);
  const addObjectMode = useWorkspaceStore((state) => state.addObjectMode);
  const cancelPlacement = useWorkspaceStore((state) => state.cancelPlacement);
  const addAgent = useWorkspaceStore((state) => state.addAgent);
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="pointer-events-auto flex h-full min-h-0 w-64 flex-col gap-3 rounded-[20px] border border-white/80 bg-white/95 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.2)] backdrop-blur-sm md:w-72"
    >
      <div className="border-b border-slate-200/80 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Object Library</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Build the workspace</h2>
      </div>
      <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {OBJECT_ORDER.map((type) => {
          const definition = OBJECT_DEFINITIONS[type];
          const active = placementType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => (active ? cancelPlacement() : addObjectMode(type))}
              className={[
                "group w-full rounded-2xl border p-3 text-left transition",
                active ? "border-cyan-300 bg-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]" : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: definition.color }} />
                <span className="text-sm font-semibold text-slate-900">{definition.label}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{definition.purpose}</p>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-3">
        <button type="button" onClick={addAgent} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-950/15">
          Add agent
        </button>
        <button type="button" onClick={resetWorkspace} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          Reset
        </button>
      </div>
    </motion.aside>
  );
}
