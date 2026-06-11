"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AGENT_BY_ID } from "@/lib/agents";
import { levelFromXp, levelProgress, xpForLevel } from "@/lib/xp";
import { useCrewStore } from "@/stores/useCrewStore";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Stat } from "@/components/ui/Stat";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function relativeTime(at: number): string {
  const diff = Date.now() - at;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return `il y a ${Math.floor(diff / 86_400_000)} j`;
}

/** Fiche riche de l'agent sélectionné : niveau, XP, stats, historique. */
export function AgentProfile() {
  const selectedAgent = useCrewStore((s) => s.selectedAgent);
  const selectAgent = useCrewStore((s) => s.selectAgent);
  const stats = useCrewStore((s) =>
    s.selectedAgent ? s.agentStats[s.selectedAgent] : null,
  );
  const weekDone = useCrewStore((s) =>
    s.selectedAgent
      ? s.tasks.filter(
          (t) =>
            t.agentId === s.selectedAgent &&
            t.status === "done" &&
            (t.completedAt ?? 0) > Date.now() - WEEK_MS,
        ).length
      : 0,
  );

  const def = selectedAgent ? AGENT_BY_ID[selectedAgent] : null;
  const level = stats ? levelFromXp(stats.xp) : 1;
  const nextLevelXp = xpForLevel(level + 1);

  // Spécialités : tags les plus fréquents de l'historique.
  const specialties = stats
    ? [...stats.history.flatMap((h) => h.tags).reduce((m, tag) => {
        m.set(tag, (m.get(tag) ?? 0) + 1);
        return m;
      }, new Map<string, number>())]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag)
    : [];

  return (
    <AnimatePresence>
      {def && stats ? (
        <motion.aside
          key={def.id}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass fixed bottom-4 left-4 z-40 w-[min(92vw,330px)] rounded-2xl p-4"
          role="dialog"
          aria-label={`Profil de ${def.name}`}
        >
          <div className="flex items-start gap-3">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-ink"
              style={{
                background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${def.color} 40%, white), ${def.color})`,
                boxShadow: `0 0 20px ${def.color}66`,
              }}
            >
              {def.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold tracking-wide">{def.name}</h2>
                <Chip color={def.color}>niv. {level}</Chip>
              </div>
              <p className="label-mono mt-0.5">{def.role}</p>
            </div>
            <button
              type="button"
              onClick={() => selectAgent(null)}
              aria-label="Fermer le profil"
              className="focus-ring -mt-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              ×
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted italic">
            « {def.personality} »
          </p>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="label-mono">Expérience</span>
              <span className="font-mono text-[9px] text-muted tabular-nums">
                {stats.xp} / {nextLevelXp} XP
              </span>
            </div>
            <ProgressBar value={levelProgress(stats.xp)} color={def.color} className="mt-1.5" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Terminées" value={stats.done} accent={def.color} />
            <Stat label="Cette semaine" value={weekDone} accent="#5EE7FF" />
          </div>

          {specialties.length > 0 ? (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="label-mono shrink-0">Spécialités</span>
              <div className="flex flex-wrap gap-1">
                {specialties.map((tag) => (
                  <Chip key={tag} color={def.color}>
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 border-t border-[rgba(234,240,248,0.06)] pt-2.5">
            <span className="label-mono">Historique récent</span>
            {stats.history.length === 0 ? (
              <p className="mt-1.5 text-[11px] text-muted">
                Aucune tâche terminée pour l&apos;instant.
              </p>
            ) : (
              <ol className="mt-1.5 flex flex-col gap-1">
                {stats.history.slice(0, 5).map((h) => (
                  <li key={h.taskId} className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/85">
                      <span style={{ color: def.color }}>✓</span> {h.title}
                    </span>
                    <span className="label-mono shrink-0">{relativeTime(h.at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
