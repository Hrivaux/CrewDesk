"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { SceneAgent, ScenePlugin, SceneZone } from "@/lib/crewdesk-scene";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/crewdesk-scene";

export type SceneSelection =
  | { type: "agent"; agent: SceneAgent }
  | { type: "zone"; zone: SceneZone; activeAgents: SceneAgent[] }
  | { type: "plugin"; plugin: ScenePlugin }
  | null;

export function AgentPanel({
  selection,
  onClose,
  onViewTask,
  onAssign,
}: {
  selection: SceneSelection;
  onClose: () => void;
  onViewTask: (agent: SceneAgent) => void;
  onAssign: (agent?: SceneAgent) => void;
}) {
  return (
    <AnimatePresence>
      {selection ? (
        <motion.aside
          key={selection.type === "agent" ? selection.agent.id : selection.type === "zone" ? selection.zone.id : selection.plugin.id}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="scene3d-panel scene3d-panel--wide"
        >
          <button type="button" className="scene3d-panel-close focus-ring" onClick={onClose} aria-label="Fermer">
            ×
          </button>
          {selection.type === "agent" ? (
            <AgentPanelContent agent={selection.agent} onViewTask={onViewTask} onAssign={onAssign} />
          ) : selection.type === "zone" ? (
            <ZonePanelContent zone={selection.zone} agents={selection.activeAgents} />
          ) : (
            <PluginPanelContent plugin={selection.plugin} />
          )}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function AgentPanelContent({
  agent,
  onViewTask,
  onAssign,
}: {
  agent: SceneAgent;
  onViewTask: (agent: SceneAgent) => void;
  onAssign: (agent?: SceneAgent) => void;
}) {
  return (
    <>
      <p className="scene3d-panel-kicker">Agent actif</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="scene3d-panel-dot" style={{ background: agent.color, boxShadow: `0 0 18px ${agent.color}` }} />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-white">{agent.name}</h2>
          <p className="truncate text-sm text-slate-300">{agent.role}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/7 p-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
          <span className="truncate">{agent.currentTask}</span>
          <span className="font-mono text-cyan">{agent.progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="h-full rounded-full"
            style={{ background: STATUS_COLOR[agent.status] }}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/6 p-3">
          <dt className="text-slate-500">Statut</dt>
          <dd className="mt-1 font-mono uppercase tracking-[0.14em]" style={{ color: STATUS_COLOR[agent.status] }}>
            {STATUS_LABEL[agent.status]}
          </dd>
        </div>
        <div className="rounded-xl bg-white/6 p-3">
          <dt className="text-slate-500">Zone actuelle</dt>
          <dd className="mt-1 line-clamp-2 text-slate-200">{agent.zoneName}</dd>
        </div>
      </dl>

      <PanelChips title="Skills" items={agent.skills} />
      <PanelChips title="Plugins" items={agent.plugins} accent={agent.color} />
      <p className="mt-3 line-clamp-2 text-xs text-slate-400">{agent.lastAction}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="scene3d-panel-action scene3d-panel-action--primary focus-ring" onClick={() => onViewTask(agent)}>
          Voir tâche
        </button>
        <button type="button" className="scene3d-panel-action focus-ring" onClick={() => onAssign(agent)}>
          Assigner
        </button>
      </div>
    </>
  );
}

function ZonePanelContent({ zone, agents }: { zone: SceneZone; agents: SceneAgent[] }) {
  return (
    <>
      <p className="scene3d-panel-kicker">Zone</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="scene3d-panel-dot" style={{ background: zone.color, boxShadow: `0 0 18px ${zone.color}` }} />
        <div>
          <h2 className="font-display text-xl font-semibold text-white">{zone.name}</h2>
          <p className="text-sm text-slate-300">{zone.function}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/6 p-3">
          <dt className="text-slate-500">Agents actifs</dt>
          <dd className="mt-1 text-slate-200">{agents.length ? agents.map((agent) => agent.name).join(", ") : "Aucun agent en cours"}</dd>
        </div>
        <div className="rounded-xl bg-white/6 p-3">
          <dt className="text-slate-500">Plugins liés</dt>
          <dd className="mt-1 text-slate-200">{zone.plugins.join(", ")}</dd>
        </div>
      </div>
    </>
  );
}

function PluginPanelContent({ plugin }: { plugin: ScenePlugin }) {
  return (
    <>
      <p className="scene3d-panel-kicker">Plugin station</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="scene3d-panel-dot" style={{ background: plugin.color, boxShadow: `0 0 18px ${plugin.color}` }} />
        <div>
          <h2 className="font-display text-xl font-semibold text-white">{plugin.label}</h2>
          <p className="text-sm text-slate-300">{plugin.function}</p>
        </div>
      </div>
    </>
  );
}

function PanelChips({ title, items, accent = "#22d3ee" }: { title: string; items: readonly string[]; accent?: string }) {
  return (
    <div className="mt-4">
      <p className="scene3d-panel-mini">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="scene3d-chip" style={{ "--chip-accent": accent } as CSSProperties}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
