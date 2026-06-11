"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { LayoutGroup } from "framer-motion";
import type { Task, TaskStatus } from "@/services/types";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { COLUMNS, KanbanColumn } from "@/components/kanban/KanbanColumn";

const DONE_VISIBLE = 10;

function sortForColumn(status: TaskStatus, tasks: Task[]): Task[] {
  const list = [...tasks];
  if (status === "done") {
    return list.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  }
  if (status === "in_progress") {
    return list.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
  }
  return list.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Le kanban synchronisé : les cartes suivent les agents du diorama
 * (layout animations), et le drag & drop manuel pilote la scène en retour.
 */
export function KanbanBoard() {
  const mounted = useMounted();
  const tasks = useCrewStore((s) => s.tasks);
  const moveTask = useCrewStore((s) => s.moveTask);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const to = event.over?.id as TaskStatus | undefined;
    const taskId = String(event.active.id);
    if (to) moveTask(taskId, to);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <LayoutGroup>
        <div className="flex h-full snap-x gap-3 overflow-x-auto pb-1">
          {COLUMNS.map((column) => {
            const all = mounted
              ? sortForColumn(
                  column.status,
                  tasks.filter((t) => t.status === column.status),
                )
              : [];
            const visible = column.status === "done" ? all.slice(0, DONE_VISIBLE) : all;
            return (
              <KanbanColumn
                key={column.status}
                column={column}
                tasks={visible}
                total={all.length}
              />
            );
          })}
        </div>
      </LayoutGroup>
    </DndContext>
  );
}
