"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { AgentId } from "@/services/types";
import { AGENTS, agentRender, AGENT_BY_ID } from "@/lib/agents";
import { BOARD_H, BOARD_W, depth, project } from "@/lib/iso";
import { useCrewStore } from "@/stores/useCrewStore";
import { AgentSprite } from "@/components/scene/AgentSprite";
import { DispatchPacket } from "@/components/scene/DispatchPacket";
import { Platform } from "@/components/scene/Platform";
import { Prop, PROPS } from "@/components/scene/Prop";

/** Pieds d'Atlas : origine de l'onde de commandement à la validation d'un plan. */
const ATLAS_POS = project(AGENT_BY_ID.atlas.workSpot);

interface DustSpec {
  left: string;
  top: string;
  dur: string;
  delay: string;
}

function makeDust(count: number): DustSpec[] {
  return Array.from({ length: count }, () => ({
    left: `${6 + Math.random() * 88}%`,
    top: `${10 + Math.random() * 80}%`,
    dur: `${7 + Math.random() * 7}s`,
    delay: `${Math.random() * 8}s`,
  }));
}

/**
 * Le diorama : plateforme flottante, props, agents animés.
 * Boucle rAF hors React : positions et orientation appliquées via refs,
 * aucun re-render de la scène par frame.
 */
export function Diorama() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const agentRefs = useRef<Partial<Record<AgentId, HTMLDivElement>>>({});
  const [dust, setDust] = useState<DustSpec[] | null>(null);
  const dispatchesFx = useCrewStore((s) => s.dispatchesFx);
  const atlasBurst = useCrewStore((s) => s.atlasBurst);

  useEffect(() => setDust(makeDust(16)), []);

  // Parallaxe douce au pointeur + échelle adaptée au conteneur.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let nx = 0;
    let ny = 0;
    const onPointerMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          scene.style.setProperty("--px", nx.toFixed(3));
          scene.style.setProperty("--py", ny.toFixed(3));
          raf = 0;
        });
      }
    };
    if (!reduced) scene.addEventListener("pointermove", onPointerMove);

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const scale = Math.min(Math.max(Math.min(width / 740, height / 580), 0.55), 1.3);
      scene.style.setProperty("--scene-scale", scale.toFixed(3));
    });
    ro.observe(scene);

    return () => {
      scene.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Boucle d'animation des agents (positions, orientation, profondeur).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const { agents } = useCrewStore.getState();
      for (const def of AGENTS) {
        const el = agentRefs.current[def.id];
        if (!el) continue;
        const rt = agents[def.id];
        const { pos, facing, moving } = agentRender(rt, def, now);
        const p = project(pos);
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        el.style.zIndex = String(10 + depth(pos));
        if (el.dataset.walking !== (moving ? "1" : "0")) {
          el.dataset.walking = moving ? "1" : "0";
        }
        if (el.dataset.facing !== facing) el.dataset.facing = facing;
        if (el.dataset.status !== rt.status) el.dataset.status = rt.status;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={sceneRef} className="scene h-full w-full" aria-label="Diorama de l'équipe">
      <div className="scene-nebula" />
      <div className="scene-lamp" />

      {dust?.map((d, i) => (
        <span
          key={i}
          className="dust"
          style={
            {
              left: d.left,
              top: d.top,
              "--dur": d.dur,
              "--delay": d.delay,
            } as CSSProperties
          }
        />
      ))}

      <div className="platform-scale">
        <div className="platform-float">
          <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
            <Platform />
            {PROPS.map((spec) => (
              <Prop key={spec.id} spec={spec} />
            ))}
            {AGENTS.map((def) => (
              <AgentSprite
                key={def.id}
                def={def}
                onRef={(el) => {
                  if (el) agentRefs.current[def.id] = el;
                  else delete agentRefs.current[def.id];
                }}
              />
            ))}
            {dispatchesFx.map((fx) => (
              <DispatchPacket key={fx.id} fx={fx} />
            ))}
            {atlasBurst > 0 ? (
              <motion.div
                key={atlasBurst}
                aria-hidden
                className="pointer-events-none absolute rounded-[50%] border"
                style={{
                  left: ATLAS_POS.x - 90,
                  top: ATLAS_POS.y - 45,
                  width: 180,
                  height: 90,
                  zIndex: 300,
                  borderColor: "rgba(94,231,255,0.75)",
                  boxShadow:
                    "0 0 30px rgba(94,231,255,0.4), inset 0 0 22px rgba(94,231,255,0.2)",
                }}
                initial={{ scale: 0.08, opacity: 0.95 }}
                animate={{ scale: 2.7, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="scene-grain" />

      {/* Légende discrète en bas de scène */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
        <p className="label-mono whitespace-nowrap">
          {AGENT_BY_ID.atlas.name} orchestre · {AGENTS.length - 1} spécialistes
        </p>
      </div>
    </div>
  );
}
