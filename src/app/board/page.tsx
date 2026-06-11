"use client";

import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TopBar } from "@/components/hud/TopBar";

export default function BoardPage() {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.05 }}
        className="min-h-0 flex-1 p-3"
      >
        <KanbanBoard />
      </motion.main>
    </div>
  );
}
