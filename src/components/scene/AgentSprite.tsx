"use client";

import type { CSSProperties } from "react";
import type { AgentDef } from "@/lib/agents";
import { depth, project } from "@/lib/iso";
import { useCrewStore } from "@/stores/useCrewStore";
import { Bubble } from "@/components/scene/Bubble";
import { SelectionRing } from "@/components/scene/SelectionRing";

interface AgentSpriteProps {
  def: AgentDef;
  /** Ordre d'entrée en scène (animation séquencée au montage). */
  index: number;
  /** Enregistre l'élément racine auprès de la boucle rAF du diorama. */
  onRef: (el: HTMLDivElement | null) => void;
}

const BLINK_DELAYS = [0, 1.4, 0.6, 2.1, 0.9, 1.7];

/**
 * Le sprite d'un agent-robot. La position (transform/z-index) est pilotée
 * en impératif par la boucle rAF du Diorama — aucun re-render par frame.
 */
export function AgentSprite({ def, index, onRef }: AgentSpriteProps) {
  const selected = useCrewStore((s) => s.selectedAgent === def.id);
  const hovered = useCrewStore((s) => s.hoveredAgent === def.id);
  const pacing = useCrewStore((s) =>
    def.isOrchestrator ? s.queuePressure : false,
  );
  const selectAgent = useCrewStore((s) => s.selectAgent);
  const setHoveredAgent = useCrewStore((s) => s.setHoveredAgent);

  const initial = project(def.isOrchestrator ? def.workSpot : def.idleSpot);
  const blinkDelay =
    BLINK_DELAYS[def.id.charCodeAt(0) % BLINK_DELAYS.length] ?? 0;

  const vars = {
    "--ac": def.color,
    "--aw": def.isOrchestrator ? "54px" : "42px",
    "--ah": def.isOrchestrator ? "78px" : "64px",
    "--enter-delay": `${0.5 + index * 0.16}s`,
  } as CSSProperties;

  return (
    <div
      ref={onRef}
      className={`agent ${def.isOrchestrator ? "agent--atlas" : ""}`}
      data-status={def.isOrchestrator ? "working" : "idle"}
      data-facing="right"
      data-walking="0"
      data-selected={selected ? "1" : "0"}
      data-hovered={hovered ? "1" : "0"}
      data-pacing={pacing ? "1" : "0"}
      style={{
        ...vars,
        transform: `translate3d(${initial.x}px, ${initial.y}px, 0)`,
        zIndex:
          10 + depth(def.isOrchestrator ? def.workSpot : def.idleSpot),
      }}
    >
      <div className="agent-tile" />
      {selected || hovered ? <SelectionRing /> : null}
      <div className="agent-shadow" />
      <button
        type="button"
        className="agent-wrap focus-ring"
        aria-label={`${def.name} — ${def.role}`}
        onClick={() => selectAgent(selected ? null : def.id)}
        onPointerEnter={() => setHoveredAgent(def.id)}
        onPointerLeave={() => setHoveredAgent(null)}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <div className="agent-bob">
          <div className="agent-leg agent-leg--l" />
          <div className="agent-leg agent-leg--r" />
          <div className="agent-torso">
            <span className="agent-core" />
            <span className="agent-panel agent-panel--l" />
            <span className="agent-panel agent-panel--r" />
          </div>
          <div className="agent-head">
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
          </div>
          <div className="agent-antenna" />
          <div className="agent-arm agent-arm--l" />
          <div className="agent-arm agent-arm--r" />
        </div>
      </button>
      <div className="agent-tag">
        {def.name} · {def.role}
      </div>
      <span className="agent-coffee" aria-hidden>
        ☕
      </span>
      <Bubble agentId={def.id} color={def.color} />
    </div>
  );
}
