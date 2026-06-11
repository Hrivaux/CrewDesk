"use client";

import { motion } from "framer-motion";

/** Atlas réfléchit : trois points cyan qui ondulent. */
export function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5" aria-label="Atlas analyse la demande">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 6px #5EE7FF" }}
        />
      ))}
    </div>
  );
}
