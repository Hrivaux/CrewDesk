"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ScenePhase } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";

const PHASE_LABEL: Record<ScenePhase, string> = {
  auto: "Auto",
  day: "Jour",
  night: "Nuit",
};

const PHASE_ICON: Record<ScenePhase, string> = {
  auto: "◐",
  day: "☀",
  night: "☾",
};

const NEXT_PHASE: Record<ScenePhase, ScenePhase> = {
  auto: "day",
  day: "night",
  night: "auto",
};

interface Theme {
  id: string;
  name: string;
  locked: boolean;
}

/** Skins du diorama — futurs leviers d'abonnement. */
const THEMES: Theme[] = [
  { id: "mission-control", name: "Mission Control", locked: false },
  { id: "loft", name: "Loft", locked: true },
  { id: "vaisseau", name: "Vaisseau spatial", locked: true },
  { id: "cabane", name: "Cabane japonaise", locked: true },
];

function ControlButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`focus-ring grid h-8 w-8 place-items-center rounded-lg border text-xs backdrop-blur-sm transition-colors ${
        active
          ? "border-cyan/40 bg-cyan/15 text-cyan"
          : "border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/** Contrôles de la scène : phase jour/nuit, replay, thèmes. */
export function SceneControls() {
  const scenePhase = useCrewStore((s) => s.scenePhase);
  const setScenePhase = useCrewStore((s) => s.setScenePhase);
  const sceneTheme = useCrewStore((s) => s.sceneTheme);
  const replayOpen = useCrewStore((s) => s.replayOpen);
  const setReplayOpen = useCrewStore((s) => s.setReplayOpen);
  const pushToast = useCrewStore((s) => s.pushToast);
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
      <ControlButton
        label={`Éclairage : ${PHASE_LABEL[scenePhase]}`}
        onClick={() => setScenePhase(NEXT_PHASE[scenePhase])}
      >
        {PHASE_ICON[scenePhase]}
      </ControlButton>

      <ControlButton
        label="Replay de la journée"
        active={replayOpen}
        onClick={() => setReplayOpen(!replayOpen)}
      >
        ⟲
      </ControlButton>

      <div className="relative">
        <ControlButton
          label="Thèmes du bureau"
          active={themesOpen}
          onClick={() => setThemesOpen((o) => !o)}
        >
          ✦
        </ControlButton>
        <AnimatePresence>
          {themesOpen ? (
            <motion.ul
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass absolute top-10 left-0 z-20 w-44 rounded-xl p-1.5"
              role="menu"
              aria-label="Thèmes du bureau"
            >
              {THEMES.map((theme) => (
                <li key={theme.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (theme.locked) {
                        pushToast({
                          title: `Thème « ${theme.name} »`,
                          message: "Bientôt — disponible avec l'offre Pro.",
                          color: "#FFB35C",
                        });
                      }
                      setThemesOpen(false);
                    }}
                    className="focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-[rgba(234,240,248,0.05)]"
                  >
                    <span
                      className={
                        theme.id === sceneTheme ? "text-cyan" : "text-foreground/85"
                      }
                    >
                      {theme.name}
                    </span>
                    {theme.locked ? (
                      <span className="label-mono text-amber">Pro 🔒</span>
                    ) : (
                      <span className="label-mono text-cyan">actif</span>
                    )}
                  </button>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
