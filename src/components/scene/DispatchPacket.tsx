"use client";

import { motion } from "framer-motion";
import type { DispatchFx } from "@/services/types";
import { AGENT_BY_ID } from "@/lib/agents";
import { project } from "@/lib/iso";
import { useCrewStore } from "@/stores/useCrewStore";

/**
 * Paquet lumineux : Atlas "lance" la tâche vers le poste de l'agent assigné,
 * en arc de cercle au-dessus de la scène.
 */
export function DispatchPacket({ fx }: { fx: DispatchFx }) {
  const removeDispatchFx = useCrewStore((s) => s.removeDispatchFx);

  const atlas = AGENT_BY_ID.atlas;
  const target = AGENT_BY_ID[fx.to];
  const from = project(atlas.workSpot);
  const to = project(target.workSpot);
  const midX = (from.x + to.x) / 2;
  const peakY = Math.min(from.y, to.y) - 72;

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0"
      style={{ zIndex: 400 }}
      initial={{ x: from.x, y: from.y - 52, opacity: 0, scale: 0.4 }}
      animate={{
        x: [from.x, midX, to.x],
        y: [from.y - 52, peakY, to.y - 26],
        opacity: [0, 1, 1],
        scale: [0.4, 1, 0.7],
      }}
      transition={{ duration: 0.85, ease: "easeInOut", times: [0, 0.5, 1] }}
      onAnimationComplete={() => removeDispatchFx(fx.id)}
    >
      <div
        className="h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: fx.color,
          boxShadow: `0 0 14px 3px ${fx.color}, 0 0 36px 10px ${fx.color}55`,
        }}
      />
    </motion.div>
  );
}
