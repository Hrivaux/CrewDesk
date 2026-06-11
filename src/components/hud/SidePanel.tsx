"use client";

import { motion } from "framer-motion";
import { AGENTS, AGENT_BY_ID } from "@/lib/agents";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { ActivityFeed } from "@/components/hud/ActivityFeed";
import { AgentRow } from "@/components/hud/AgentRow";
import { Chip } from "@/components/ui/Chip";
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
  const selectedAgent = useCrewStore((s) => s.selectedAgent);

  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const queued = tasks.filter((t) => t.status === "backlog" || t.status === "assigned").length;
  const activeAgents = useCrewStore(
    (s) => Object.values(s.agents).filter((a) => a.status === "working" && !AGENT_BY_ID[a.id].isOrchestrator).length,
  );

  const selected = selectedAgent ? AGENT_BY_ID[selectedAgent] : null;

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
          {selected ? (
            <div className="mx-3 mt-2 rounded-xl border border-[rgba(234,240,248,0.07)] bg-[rgba(7,9,14,0.45)] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-semibold" style={{ color: selected.color }}>
                  {selected.name}
                </span>
                <Chip color={selected.color}>{selected.role}</Chip>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted italic">
                « {selected.personality} »
              </p>
            </div>
          ) : null}
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
