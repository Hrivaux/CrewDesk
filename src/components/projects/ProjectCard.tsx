"use client";

import { motion } from "framer-motion";
import type { Project, Task } from "@/services/types";
import { AGENT_BY_ID } from "@/lib/agents";
import { formatUSD } from "@/lib/format";
import type { AgentId } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Panel } from "@/components/ui/Panel";
import { ProgressRing } from "@/components/ui/ProgressRing";

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  index: number;
}

function formatDeadline(at: number): string {
  return new Date(at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function daysLeft(at: number): number {
  return Math.max(0, Math.ceil((at - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function ProjectCard({ project, tasks, index }: ProjectCardProps) {
  const setPreviewProject = useCrewStore((s) => s.setPreviewProject);
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "review",
  ).length;
  const progress = tasks.length === 0 ? 0 : (done / tasks.length) * 100;
  const costUSD = tasks.reduce((sum, t) => sum + (t.usage?.costUSD ?? 0), 0);
  const agentIds = [...new Set(tasks.map((t) => t.agentId))] as AgentId[];
  const remaining = daysLeft(project.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.07 }}
    >
      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className="font-display text-base font-bold tracking-wide"
              style={{ textShadow: `0 0 24px ${project.color}44` }}
            >
              {project.name}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{project.objective}</p>
            {project.dir ? (
              <div className="mt-2 flex items-center gap-2">
                <p className="truncate font-mono text-[9px] tracking-[0.08em] text-cyan/70">
                  📁 {project.dir}/
                </p>
                <Button onClick={() => setPreviewProject(project.id)}>▶ Aperçu</Button>
              </div>
            ) : null}
          </div>
          <ProgressRing value={progress} color={project.color} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip color={project.color}>
            {done}/{tasks.length} tâches
          </Chip>
          {inProgress > 0 ? <Chip color="#5EE7FF">{inProgress} en cours</Chip> : null}
          {costUSD > 0 ? <Chip color="#3CDFA0">{formatUSD(costUSD)}</Chip> : null}
          <Chip color={remaining <= 3 ? "#FF8A4C" : "#FFB35C"}>
            ⏱ {formatDeadline(project.deadline)} · J-{remaining}
          </Chip>
        </div>

        <div className="flex items-center justify-between border-t border-[rgba(234,240,248,0.06)] pt-3">
          <span className="label-mono">Équipe impliquée</span>
          <div className="flex -space-x-1.5">
            {agentIds.map((id) => {
              const def = AGENT_BY_ID[id];
              return (
                <span
                  key={id}
                  title={`${def.name} · ${def.role}`}
                  className="grid h-6 w-6 place-items-center rounded-full border-2 border-surface font-display text-[9px] font-bold text-ink"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${def.color} 40%, white), ${def.color})`,
                  }}
                >
                  {def.name.charAt(0)}
                </span>
              );
            })}
            {agentIds.length === 0 ? <span className="label-mono">—</span> : null}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}
