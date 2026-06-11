"use client";

import type { AgentDef } from "@/lib/agents";
import type { AgentStatus } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";
import { ProgressBar } from "@/components/ui/ProgressBar";

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "repos",
  walking: "en route",
  working: "en mission",
  returning: "retour",
  break: "pause café",
};

export function AgentRow({ def }: { def: AgentDef }) {
  const rt = useCrewStore((s) => s.agents[def.id]);
  const task = useCrewStore((s) =>
    rt.taskId ? s.tasks.find((t) => t.id === rt.taskId) : undefined,
  );
  const selected = useCrewStore((s) => s.selectedAgent === def.id);
  const hovered = useCrewStore((s) => s.hoveredAgent === def.id);
  const selectAgent = useCrewStore((s) => s.selectAgent);
  const setHoveredAgent = useCrewStore((s) => s.setHoveredAgent);

  const active = rt.status === "working";

  return (
    <button
      type="button"
      onClick={() => selectAgent(selected ? null : def.id)}
      onPointerEnter={() => setHoveredAgent(def.id)}
      onPointerLeave={() => setHoveredAgent(null)}
      className={`focus-ring group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-150 ${
        selected
          ? "border-[rgba(94,231,255,0.35)] bg-[rgba(94,231,255,0.06)]"
          : hovered
            ? "border-transparent bg-[rgba(234,240,248,0.05)]"
            : "border-transparent hover:bg-[rgba(234,240,248,0.04)]"
      }`}
    >
      {/* Avatar miniature */}
      <span
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[11px] font-bold text-ink"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${def.color} 40%, white), ${def.color})`,
          boxShadow: `0 0 12px ${def.color}55`,
        }}
      >
        {def.name.charAt(0)}
        <span
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface"
          style={{
            background: active ? def.color : rt.status === "idle" ? "#7E8CA0" : "#FFB35C",
            boxShadow: active ? `0 0 6px ${def.color}` : undefined,
          }}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display text-xs font-semibold">{def.name}</span>
          <span className="label-mono shrink-0" style={active ? { color: def.color } : undefined}>
            {STATUS_LABEL[rt.status]}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {task ? task.title : def.role}
        </span>
        {task && task.status === "in_progress" ? (
          <ProgressBar value={task.progress} color={def.color} className="mt-1.5" />
        ) : null}
      </span>
    </button>
  );
}
