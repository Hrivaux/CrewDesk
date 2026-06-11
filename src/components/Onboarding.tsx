"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";

interface Step {
  title: string;
  body: string;
  color?: string;
  avatar?: string;
}

const STEPS: Step[] = [
  {
    title: "Bienvenue dans CrewDesk",
    body: "Votre mission control personnel : une équipe d'agents IA qui travaille sous vos yeux, orchestrée par un seul interlocuteur.",
  },
  ...AGENTS.map((a) => ({
    title: a.isOrchestrator ? `${a.name} — votre interlocuteur unique` : a.name,
    body: a.isOrchestrator
      ? `${a.role}. ${a.personality} Décrivez-lui un besoin : il découpe, assigne et supervise.`
      : `${a.role}. ${a.personality}`,
    color: a.color,
    avatar: a.name.charAt(0),
  })),
  {
    title: "C'est parti",
    body: "Parlez à Atlas (bouton en bas à droite), suivez le kanban synchronisé, ou pilotez tout au clavier avec ⌘K.",
  },
];

const STEP_MS = 2600;

/** Onboarding cinématique du premier lancement : l'équipe se présente. */
export function Onboarding() {
  const mounted = useMounted();
  const done = useCrewStore((s) => s.onboardingDone);
  const setDone = useCrewStore((s) => s.setOnboardingDone);
  const [step, setStep] = useState(0);

  const active = mounted && !done;

  // Avance automatiquement ; le dernier écran attend un clic.
  useEffect(() => {
    if (!active || step >= STEPS.length - 1) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [active, step]);

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {active && current ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(7,9,14,0.72)] backdrop-blur-[4px]"
          role="dialog"
          aria-label="Présentation de CrewDesk"
          onClick={() => {
            if (step < STEPS.length - 1) setStep((s) => s + 1);
            else setDone();
          }}
        >
          <div className="relative mx-4 w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 26, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                className="glass rounded-2xl p-7 text-center"
                style={
                  current.color
                    ? { boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 40px ${current.color}22` }
                    : undefined
                }
              >
                {current.avatar ? (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full font-display text-2xl font-bold text-ink"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${current.color ?? "#5EE7FF"} 40%, white), ${current.color ?? "#5EE7FF"})`,
                      boxShadow: `0 0 30px ${current.color ?? "#5EE7FF"}77`,
                    }}
                  >
                    {current.avatar}
                  </motion.span>
                ) : (
                  <motion.svg
                    width="56"
                    height="56"
                    viewBox="0 0 32 32"
                    className="mx-auto mb-4"
                    initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    aria-hidden
                  >
                    <path d="M16 7 27 13.5 16 20 5 13.5Z" fill="#10161F" stroke="#5EE7FF" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M5 13.5V18L16 24.5 27 18V13.5L16 20Z" fill="#0B1119" stroke="#5EE7FF" strokeWidth="1.1" strokeLinejoin="round" opacity="0.7" />
                    <circle cx="16" cy="13.5" r="2.4" fill="#5EE7FF" />
                  </motion.svg>
                )}

                <h2 className="font-display text-lg font-bold tracking-wide">{current.title}</h2>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">
                  {current.body}
                </p>

                {step === STEPS.length - 1 ? (
                  <Button
                    variant="primary"
                    className="mt-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDone();
                    }}
                  >
                    Entrer dans le mission control
                  </Button>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {/* Progression + passer */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="h-1 w-4 rounded-full transition-colors duration-300"
                    style={{
                      background: i <= step ? "#5EE7FF" : "rgba(234,240,248,0.15)",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDone();
                }}
                className="focus-ring label-mono transition-colors hover:text-foreground"
              >
                Passer
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
