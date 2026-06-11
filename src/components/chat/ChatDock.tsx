"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { ChatPanel } from "@/components/chat/ChatPanel";

/** Bouton flottant + panneau : le point d'entrée vers Atlas. */
export function ChatDock() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const hasPendingPlan = useCrewStore((s) => s.pendingPlan !== null);

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.4 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer le chat avec Atlas" : "Parler à Atlas"}
        aria-expanded={open}
        className="focus-ring fixed right-4 bottom-4 z-40 grid h-13 w-13 place-items-center rounded-full border border-cyan/40"
        style={{
          background: "radial-gradient(circle at 35% 30%, #ffffff, #cfeefd 55%, #6fb7d8)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 24px rgba(94,231,255,0.45)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden>
          <path d="M16 7 27 13.5 16 20 5 13.5Z" fill="#07090E" opacity="0.85" />
          <path
            d="M5 13.5V18L16 24.5 27 18V13.5L16 20Z"
            fill="#07090E"
            opacity="0.5"
          />
          <circle cx="16" cy="13.5" r="2.4" fill="#5EE7FF" />
        </svg>
        {mounted && hasPendingPlan && !open ? (
          <motion.span
            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ boxShadow: "0 0 10px #FFB35C" }}
            aria-hidden
          />
        ) : null}
      </motion.button>

      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
