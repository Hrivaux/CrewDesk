"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChatDock } from "@/components/chat/ChatDock";
import { Diorama } from "@/components/scene/Diorama";
import { SidePanel } from "@/components/hud/SidePanel";
import { TopBar } from "@/components/hud/TopBar";
import { BoardOverlay } from "@/components/kanban/BoardOverlay";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const [boardOpen, setBoardOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.05 }}
          className="glass relative min-h-[46dvh] flex-1 overflow-hidden rounded-2xl lg:min-h-0 lg:basis-[65%]"
          aria-label="Scène de l'équipe"
        >
          <Diorama />
          <div className="absolute top-3 right-3 z-10">
            <Button variant="primary" onClick={() => setBoardOpen(true)}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <rect x="0.5" y="1" width="3" height="10" rx="1" fill="currentColor" opacity="0.9" />
                <rect x="4.5" y="1" width="3" height="7" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="8.5" y="1" width="3" height="4.5" rx="1" fill="currentColor" opacity="0.35" />
              </svg>
              Kanban
            </Button>
          </div>
        </motion.section>

        <div className="min-h-0 lg:basis-[35%] lg:max-w-105">
          <SidePanel />
        </div>
      </main>

      <BoardOverlay open={boardOpen} onClose={() => setBoardOpen(false)} />
      <ChatDock />
    </div>
  );
}
