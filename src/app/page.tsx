"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSimulation } from "@/services/orchestrator";
import { Diorama } from "@/components/scene/Diorama";
import { SidePanel } from "@/components/hud/SidePanel";
import { Chip } from "@/components/ui/Chip";

function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("fr-FR", { hour12: false }));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs tracking-[0.2em] text-muted tabular-nums">
      {time ?? "--:--:--"}
    </span>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <path
          d="M16 7 27 13.5 16 20 5 13.5Z"
          fill="#10161F"
          stroke="#5EE7FF"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M5 13.5V18L16 24.5 27 18V13.5L16 20Z"
          fill="#0B1119"
          stroke="#5EE7FF"
          strokeWidth="1.1"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <circle cx="16" cy="13.5" r="2.4" fill="#5EE7FF" />
      </svg>
      <div className="flex flex-col">
        <span className="font-display text-sm leading-none font-bold tracking-wide">
          CrewDesk
        </span>
        <span className="label-mono mt-1">Mission Control</span>
      </div>
    </div>
  );
}

export default function Home() {
  useSimulation();

  return (
    <div className="flex h-dvh flex-col">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="flex h-14 shrink-0 items-center justify-between border-b border-[rgba(234,240,248,0.07)] px-5"
      >
        <Logo />
        <div className="flex items-center gap-4">
          <Clock />
          <Chip color="#5EE7FF">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_#5EE7FF]" />
            Simulation · v1
          </Chip>
        </div>
      </motion.header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 26, delay: 0.05 }}
          className="glass relative min-h-[46dvh] flex-1 overflow-hidden rounded-2xl lg:min-h-0 lg:basis-[65%]"
          aria-label="Scène de l'équipe"
        >
          <Diorama />
        </motion.section>

        <div className="min-h-0 lg:basis-[35%] lg:max-w-105">
          <SidePanel />
        </div>
      </main>
    </div>
  );
}
