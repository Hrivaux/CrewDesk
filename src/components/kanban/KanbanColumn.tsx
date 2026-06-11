"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/services/types";
import { TaskCard } from "@/components/kanban/TaskCard";

/** Slot d'accueil en pointillés marchants, affiché pendant le survol d'un drag. */
function DropSlot({ accent }: { accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 64 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="relative shrink-0 overflow-hidden rounded-xl"
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <rect
          x="1"
          y="1"
          rx="10"
          fill={`${accent}0D`}
          stroke={accent}
          strokeWidth="1.5"
          strokeDasharray="7 5"
          className="march"
          style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center font-mono text-[9px] tracking-[0.18em] uppercase"
        style={{ color: accent }}
      >
        déposer ici
      </span>
    </motion.div>
  );
}

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

  // Pulse de la colonne quand une carte arrive (compteur qui augmente).
  const prevTotal = useRef(total);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (total > prevTotal.current) setPulseKey((k) => k + 1);
    prevTotal.current = total;
  }, [total]);

  return (
    <section
      ref={setNodeRef}
      aria-label={`Colonne ${column.label}`}
      className="glass relative flex h-full w-60 shrink-0 snap-start flex-col rounded-2xl transition-shadow duration-200"
      style={
        isOver
          ? {
              boxShadow: `inset 0 0 0 1.5px ${column.accent}66, 0 0 24px ${column.accent}22`,
            }
          : undefined
      }
    >
      {pulseKey > 0 ? (
        <motion.span
          key={pulseKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{
            boxShadow: `inset 0 0 0 1.5px ${column.accent}88, 0 0 30px ${column.accent}33`,
          }}
        />
      ) : null}
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
        <AnimatePresence>{isOver ? <DropSlot accent={column.accent} /> : null}</AnimatePresence>
        {tasks.length === 0 && !isOver ? (
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
