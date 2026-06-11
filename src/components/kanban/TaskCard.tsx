"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { Task } from "@/services/types";
import { AGENT_BY_ID } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";
import { Confetti } from "@/components/kanban/Confetti";
import { ProgressBar } from "@/components/ui/ProgressBar";

function CardBody({ task }: { task: Task }) {
  const def = AGENT_BY_ID[task.agentId];
  const project = useCrewStore((s) =>
    task.projectId ? s.projects.find((p) => p.id === task.projectId) : undefined,
  );

  const showProgress =
    task.status === "in_progress" || (task.status === "assigned" && task.progress > 0);

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs leading-snug font-medium text-foreground">{task.title}</h3>
        <span
          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full font-display text-[9px] font-bold text-ink"
          title={`${def.name} · ${def.role}`}
          style={{
            background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${def.color} 40%, white), ${def.color})`,
            boxShadow: `0 0 8px ${def.color}55`,
          }}
        >
          {def.name.charAt(0)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {task.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[rgba(234,240,248,0.1)] px-1.5 py-px font-mono text-[8.5px] tracking-[0.12em] text-muted uppercase"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] text-muted tabular-nums">
          {task.deliverable ? (
            <span title="Livrable disponible — cliquer pour l'ouvrir" style={{ color: def.color }}>
              ▣
            </span>
          ) : null}
          {task.error ? (
            <span title={task.error} style={{ color: "#FF8A4C" }}>
              !
            </span>
          ) : null}
          ~{task.estimateMin} min
        </span>
      </div>

      {project ? (
        <p
          className="mt-1.5 truncate font-mono text-[8.5px] tracking-[0.1em] uppercase"
          style={{ color: `${project.color}AA` }}
        >
          ◆ {project.name}
        </p>
      ) : null}

      {showProgress ? (
        <ProgressBar value={task.progress} color={def.color} className="mt-2" />
      ) : null}
      {task.status === "review" ? (
        <p className="mt-2 font-mono text-[9px] tracking-[0.14em] text-amber uppercase">
          Relecture par Atlas…
        </p>
      ) : null}
    </>
  );
}

/** Copie élevée qui suit le pointeur pendant le drag (DragOverlay). */
export function TaskCardPreview({ task }: { task: Task }) {
  const def = AGENT_BY_ID[task.agentId];
  return (
    <article
      className="w-56 rotate-2 rounded-xl border bg-[rgba(16,22,31,0.92)] p-3 backdrop-blur-sm"
      style={{
        borderColor: `${def.color}88`,
        boxShadow: `0 22px 48px rgba(0,0,0,0.6), 0 0 26px ${def.color}33`,
      }}
    >
      <CardBody task={task} />
    </article>
  );
}

export function TaskCard({ task }: { task: Task }) {
  const def = AGENT_BY_ID[task.agentId];
  const celebration = useCrewStore((s) =>
    s.celebrations.find((c) => c.taskId === task.id),
  );
  const removeCelebration = useCrewStore((s) => s.removeCelebration);
  const setHoveredAgent = useCrewStore((s) => s.setHoveredAgent);
  const setSelectedTask = useCrewStore((s) => s.setSelectedTask);
  const linked = useCrewStore((s) => s.hoveredAgent === task.agentId);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerEnter={() => setHoveredAgent(task.agentId)}
      onPointerLeave={() => setHoveredAgent(null)}
      onClick={() => setSelectedTask(task.id)}
      className={`focus-ring relative touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <motion.article
        layoutId={task.id}
        layout
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative overflow-visible rounded-xl border bg-[rgba(16,22,31,0.85)] p-3 backdrop-blur-sm transition-[border-color,box-shadow] duration-150"
        style={{
          borderStyle: isDragging ? "dashed" : "solid",
          borderColor: isDragging
            ? `${def.color}66`
            : linked
              ? `${def.color}AA`
              : `${def.color}30`,
          boxShadow: linked && !isDragging
            ? `0 6px 18px rgba(0,0,0,0.3), 0 0 18px ${def.color}33`
            : "0 6px 18px rgba(0,0,0,0.3)",
        }}
      >
        {celebration ? (
          <Confetti
            color={celebration.color}
            onDone={() => removeCelebration(celebration.id)}
          />
        ) : null}
        <CardBody task={task} />
      </motion.article>
    </div>
  );
}
