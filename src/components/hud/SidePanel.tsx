"use client";

import { motion } from "framer-motion";
import { AGENTS, AGENT_BY_ID } from "@/lib/agents";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { ActivityFeed } from "@/components/hud/ActivityFeed";
import { AgentRow } from "@/components/hud/AgentRow";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Stat } from "@/components/ui/Stat";

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function SidePanel() {
  const mounted = useMounted();
  const tasks = useCrewStore((s) => s.tasks);
  const completedTotal = useCrewStore((s) => s.completedTotal);

  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const queued = tasks.filter((t) => t.status === "backlog" || t.status === "assigned").length;
  const activeAgents = useCrewStore(
    (s) => Object.values(s.agents).filter((a) => a.status === "working" && !AGENT_BY_ID[a.id].isOrchestrator).length,
  );

  return (
    <motion.aside
      className="flex h-full min-h-0 flex-col gap-3"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
    >
      {/* Stats */}
      <motion.div variants={sectionVariants} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
        <Panel className="p-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="En cours" value={mounted ? inProgress : "–"} accent="#5EE7FF" />
            <Stat label="En file" value={mounted ? queued : "–"} accent="#FFB35C" />
            <Stat label="Terminées" value={mounted ? completedTotal : "–"} accent="#3CDFA0" />
          </div>
        </Panel>
      </motion.div>

      {/* Équipe */}
      <motion.div variants={sectionVariants} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
        <Panel className="pb-2">
          <PanelHeader title="Équipe" hint={`${mounted ? activeAgents : 0}/5 actifs`} />
          <div className="flex flex-col gap-0.5 px-2">
            {AGENTS.map((def) => (
              <AgentRow key={def.id} def={def} />
            ))}
          </div>
        </Panel>
      </motion.div>

      {/* Flux d'activité */}
      <motion.div
        variants={sectionVariants}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="min-h-0 flex-1"
      >
        <Panel className="flex h-full min-h-0 flex-col">
          <PanelHeader title="Activité" hint="temps réel" />
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
            {mounted ? <ActivityFeed /> : null}
          </div>
        </Panel>
      </motion.div>
    </motion.aside>
  );
}
