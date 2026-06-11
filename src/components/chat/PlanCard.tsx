"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AgentId, Plan } from "@/services/types";
import { AGENTS, AGENT_BY_ID } from "@/lib/agents";
import { cancelPlan, validatePlan } from "@/services/orchestrator";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";

const SPECIALISTS = AGENTS.filter((a) => !a.isOrchestrator);

function PlanTaskRow({ plan, index }: { plan: Plan; index: number }) {
  const task = plan.tasks[index];
  const reassign = useCrewStore((s) => s.reassignPendingTask);
  const updateTitle = useCrewStore((s) => s.updatePendingTaskTitle);
  const removeTask = useCrewStore((s) => s.removePendingTask);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!task) return null;
  const def = AGENT_BY_ID[task.agentId];

  const commit = () => {
    updateTitle(index, draft);
    setEditing(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.06 }}
      className="rounded-lg border border-[rgba(234,240,248,0.07)] bg-[rgba(7,9,14,0.4)] px-2.5 py-2"
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-px font-mono text-[10px] font-semibold tabular-nums"
          style={{ color: def.color }}
        >
          #{index + 1}
        </span>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="focus-ring min-w-0 flex-1 rounded border border-cyan/30 bg-transparent px-1 text-[11px] text-foreground"
            aria-label="Titre de la tâche"
          />
        ) : (
          <p className="min-w-0 flex-1 text-[11px] leading-snug text-foreground">{task.title}</p>
        )}
        <button
          type="button"
          className="focus-ring shrink-0 text-[10px] text-muted transition-colors hover:text-foreground"
          aria-label={`Modifier le titre de la tâche ${index + 1}`}
          onClick={() => {
            setDraft(task.title);
            setEditing(true);
          }}
        >
          ✎
        </button>
        <button
          type="button"
          className="focus-ring shrink-0 text-[11px] text-muted transition-colors hover:text-[#FF8A4C]"
          aria-label={`Retirer la tâche ${index + 1}`}
          onClick={() => removeTask(index)}
        >
          ×
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-2 pl-5">
        <select
          value={task.agentId}
          onChange={(e) => reassign(index, e.target.value as AgentId)}
          aria-label={`Agent assigné à la tâche ${index + 1}`}
          className="focus-ring rounded border border-[rgba(234,240,248,0.12)] bg-surface px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
          style={{ color: def.color }}
        >
          {SPECIALISTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.role}
            </option>
          ))}
        </select>
        <span className="font-mono text-[9px] text-muted tabular-nums">~{task.estimateMin} min</span>
        {task.dependsOn && task.dependsOn.length > 0 ? (
          <span className="font-mono text-[9px] text-muted">
            après {task.dependsOn.map((d) => `#${d + 1}`).join(", ")}
          </span>
        ) : null}
      </div>
    </motion.li>
  );
}

/** Le plan structuré proposé par Atlas : éditable puis validable. */
export function PlanCard({ plan }: { plan: Plan }) {
  const totalMin = plan.tasks.reduce((sum, t) => sum + t.estimateMin, 0);
  const agentCount = new Set(plan.tasks.map((t) => t.agentId)).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="mt-2 rounded-xl border border-cyan/25 bg-[rgba(94,231,255,0.04)] p-3"
    >
      <p className="label-mono" style={{ color: "#5EE7FF" }}>
        Plan proposé
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{plan.summary}</p>

      <ol className="mt-2.5 flex flex-col gap-1.5">
        {plan.tasks.map((_, i) => (
          <PlanTaskRow key={`${plan.id}-${i}`} plan={plan} index={i} />
        ))}
      </ol>

      <div className="mt-2.5 flex items-center justify-between border-t border-[rgba(234,240,248,0.06)] pt-2.5">
        <span className="font-mono text-[9px] text-muted tabular-nums">
          Σ ~{totalMin} min · {plan.tasks.length} tâches · {agentCount} agents
        </span>
        <div className="flex gap-1.5">
          <Button onClick={cancelPlan}>Annuler</Button>
          <Button
            variant="primary"
            onClick={() => void validatePlan()}
            disabled={plan.tasks.length === 0}
          >
            Valider le plan
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
