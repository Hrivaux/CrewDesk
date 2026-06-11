"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/services/types";
import { TaskCard } from "@/components/kanban/TaskCard";

export interface ColumnSpec {
  status: TaskStatus;
  label: string;
  accent: string;
}

export const COLUMNS: readonly ColumnSpec[] = [
  { status: "backlog", label: "Backlog", accent: "#7E8CA0" },
  { status: "assigned", label: "Assigné", accent: "#FFB35C" },
  { status: "in_progress", label: "En cours", accent: "#5EE7FF" },
  { status: "review", label: "Revue", accent: "#A777FF" },
  { status: "done", label: "Terminé", accent: "#3CDFA0" },
] as const;

interface KanbanColumnProps {
  column: ColumnSpec;
  tasks: Task[];
  /** Nombre total (peut dépasser les cartes affichées, ex. « Terminé »). */
  total: number;
}

export function KanbanColumn({ column, tasks, total }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`Colonne ${column.label}`}
      className="glass flex h-full w-60 shrink-0 snap-start flex-col rounded-2xl transition-shadow duration-200"
      style={
        isOver
          ? {
              boxShadow: `inset 0 0 0 1.5px ${column.accent}66, 0 0 24px ${column.accent}22`,
            }
          : undefined
      }
    >
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: column.accent, boxShadow: `0 0 6px ${column.accent}` }}
          />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase">
            {column.label}
          </h2>
        </div>
        <span className="rounded-full border border-[rgba(234,240,248,0.1)] px-1.5 py-px font-mono text-[9px] text-muted tabular-nums">
          {total}
        </span>
      </header>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 ? (
          <div
            className="grid flex-1 place-items-center rounded-xl border border-dashed border-[rgba(234,240,248,0.07)]"
            style={{ minHeight: 90 }}
          >
            <span className="label-mono">vide</span>
          </div>
        ) : null}
        {total > tasks.length ? (
          <p className="label-mono px-1 pb-1 text-center">
            + {total - tasks.length} plus anciennes
          </p>
        ) : null}
      </div>
    </section>
  );
}
