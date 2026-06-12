"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CreateTask } from "@/components/kanban/CreateTask";
import { Button } from "@/components/ui/Button";

interface BoardOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** Le kanban en panneau coulissant par-dessus la scène. */
export function BoardOverlay({ open, onClose }: BoardOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label="Kanban">
          <motion.div
            className="absolute inset-0 bg-[rgba(7,9,14,0.55)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass absolute top-0 right-0 flex h-full w-[min(96vw,1240px)] flex-col rounded-l-2xl p-3"
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <header className="flex items-center justify-between px-1 pb-3">
              <div className="flex items-baseline gap-2">
                <h2 className="font-display text-sm font-bold tracking-wide">Kanban</h2>
                <span className="label-mono">synchronisé avec la scène</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreateTask />
                <Button onClick={onClose} aria-label="Fermer le kanban">
                  Fermer · Échap
                </Button>
              </div>
            </header>
            <div className="min-h-0 flex-1">
              <KanbanBoard />
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
