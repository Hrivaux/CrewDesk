"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { AgentId } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";

interface BubbleProps {
  agentId: AgentId;
  color: string;
}

/** Bulle de progression flottant au-dessus d'un agent en mission. */
export function Bubble({ agentId, color }: BubbleProps) {
  const task = useCrewStore((s) => {
    const rt = s.agents[agentId];
    if (rt.status !== "working" || !rt.taskId) return undefined;
    return s.tasks.find((t) => t.id === rt.taskId);
  });

  return (
    <AnimatePresence>
      {task ? (
        <motion.div
          key={task.id}
          className="bubble"
          initial={{ opacity: 0, scale: 0.5, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 6 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <p className="truncate text-[10px] leading-tight font-medium text-foreground">
            {task.title}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(234,240,248,0.1)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${task.progress}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                  transition: "width 0.5s ease-out",
                }}
              />
            </div>
            <span className="font-mono text-[9px] tabular-nums" style={{ color }}>
              {Math.round(task.progress)}%
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
