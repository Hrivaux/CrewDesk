"use client";

import type { CSSProperties } from "react";
import type { AgentDef } from "@/lib/agents";
import { depth, project } from "@/lib/iso";
import { useCrewStore } from "@/stores/useCrewStore";
import { Bubble } from "@/components/scene/Bubble";
import { SelectionRing } from "@/components/scene/SelectionRing";

interface AgentSpriteProps {
  def: AgentDef;
  /** Enregistre l'élément racine auprès de la boucle rAF du diorama. */
  onRef: (el: HTMLDivElement | null) => void;
}

const BLINK_DELAYS = [0, 1.4, 0.6, 2.1, 0.9, 1.7];

/**
 * Le sprite d'un agent-robot. La position (transform/z-index) est pilotée
 * en impératif par la boucle rAF du Diorama — aucun re-render par frame.
 */
export function AgentSprite({ def, onRef }: AgentSpriteProps) {
  const selected = useCrewStore((s) => s.selectedAgent === def.id);
  const selectAgent = useCrewStore((s) => s.selectAgent);

  const initial = project(def.isOrchestrator ? def.workSpot : def.idleSpot);
  const blinkDelay =
    BLINK_DELAYS[def.id.charCodeAt(0) % BLINK_DELAYS.length] ?? 0;

  const vars = {
    "--ac": def.color,
    "--aw": def.isOrchestrator ? "42px" : "32px",
    "--ah": def.isOrchestrator ? "64px" : "50px",
  } as CSSProperties;

  return (
    <div
      ref={onRef}
      className={`agent ${def.isOrchestrator ? "agent--atlas" : ""}`}
      data-status={def.isOrchestrator ? "working" : "idle"}
      data-facing="right"
      data-walking="0"
      data-selected={selected ? "1" : "0"}
      style={{
        ...vars,
        transform: `translate3d(${initial.x}px, ${initial.y}px, 0)`,
        zIndex:
          10 + depth(def.isOrchestrator ? def.workSpot : def.idleSpot),
      }}
    >
      {selected ? <SelectionRing /> : null}
      <div className="agent-shadow" />
      <button
        type="button"
        className="agent-wrap focus-ring"
        aria-label={`${def.name} — ${def.role}`}
        onClick={() => selectAgent(selected ? null : def.id)}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <div className="agent-bob">
          <div className="agent-torso" />
          <div className="agent-antenna" />
          <div className="agent-visor">
            <span
              className="agent-eye"
              style={{ "--blink-delay": `${blinkDelay}s` } as CSSProperties}
            />
            <span
              className="agent-eye"
              style={{ "--blink-delay": `${blinkDelay + 0.05}s` } as CSSProperties}
            />
          </div>
          <div className="agent-arm agent-arm--l" />
          <div className="agent-arm agent-arm--r" />
        </div>
      </button>
      <div className="agent-tag">
        {def.name} · {def.role}
      </div>
      <Bubble agentId={def.id} color={def.color} />
    </div>
  );
}
