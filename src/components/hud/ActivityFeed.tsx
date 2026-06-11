"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ActivityKind } from "@/services/types";
import { AGENT_BY_ID } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";

const KIND_ICON: Record<ActivityKind, string> = {
  dispatch: "→",
  start: "▶",
  done: "✓",
  system: "◆",
};

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("fr-FR", { hour12: false });
}

export function ActivityFeed() {
  const activity = useCrewStore((s) => s.activity);

  if (activity.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[11px] text-muted">
        L&apos;activité de l&apos;équipe apparaîtra ici.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-0.5 px-2 pb-2">
      <AnimatePresence initial={false}>
        {activity.slice(0, 24).map((evt) => {
          const color = evt.agentId ? AGENT_BY_ID[evt.agentId].color : "#7E8CA0";
          return (
            <motion.li
              key={evt.id}
              layout
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-[rgba(234,240,248,0.03)]"
            >
              <span
                className="mt-px w-3 shrink-0 text-center font-mono text-[10px]"
                style={{ color }}
              >
                {KIND_ICON[evt.kind]}
              </span>
              <span className="min-w-0 flex-1 text-[11px] leading-snug text-foreground/85">
                {evt.message}
              </span>
              <time className="label-mono mt-px shrink-0 tabular-nums">
                {formatTime(evt.at)}
              </time>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
