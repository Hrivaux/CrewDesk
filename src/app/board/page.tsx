"use client";

import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CreateTask } from "@/components/kanban/CreateTask";
import { TopBar } from "@/components/hud/TopBar";

export default function BoardPage() {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.05 }}
        className="flex min-h-0 flex-1 flex-col gap-3 p-3"
      >
        <div className="flex items-center justify-between">
          <h1 className="font-display text-sm font-bold tracking-wide">Kanban</h1>
          <CreateTask />
        </div>
        <div className="min-h-0 flex-1">
          <KanbanBoard />
        </div>
      </motion.main>
    </div>
  );
}
