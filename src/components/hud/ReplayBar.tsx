"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENT_BY_ID } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";

const SPEEDS = [1, 2, 4] as const;

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("fr-FR", { hour12: false });
}

/**
 * Mode Replay : timeline scrubbable de la journée — on rejoue le fil
 * des événements en accéléré, les complétions marquées en grand.
 */
export function ReplayBar() {
  const open = useCrewStore((s) => s.replayOpen);
  const setReplayOpen = useCrewStore((s) => s.setReplayOpen);
  const activity = useCrewStore((s) => s.activity);

  // Du plus ancien au plus récent.
  const events = useMemo(() => [...activity].reverse(), [activity]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(2);

  // À l'ouverture : on repart du début, prêt à jouer.
  useEffect(() => {
    if (open) {
      setCursor(0);
      setPlaying(events.length > 1);
    } else {
      setPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const id = window.setInterval(() => {
      setCursor((c) => {
        if (c >= events.length - 1) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 850 / speed);
    return () => window.clearInterval(id);
  }, [playing, speed, events.length]);

  const first = events[0];
  const last = events[events.length - 1];
  const current = events[Math.min(cursor, events.length - 1)];
  const span = first && last ? Math.max(1, last.at - first.at) : 1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass absolute inset-x-3 bottom-3 z-20 rounded-2xl p-3"
          role="region"
          aria-label="Replay de la journée"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="label-mono" style={{ color: "#5EE7FF" }}>
                ⟲ Replay
              </span>
              {first && last ? (
                <span className="font-mono text-[9px] text-muted tabular-nums">
                  {formatTime(first.at)} → {formatTime(last.at)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpeed(sp)}
                  className={`focus-ring rounded px-1.5 py-0.5 font-mono text-[9px] tabular-nums transition-colors ${
                    speed === sp ? "bg-cyan/15 text-cyan" : "text-muted hover:text-foreground"
                  }`}
                >
                  ×{sp}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (cursor >= events.length - 1) setCursor(0);
                  setPlaying((p) => !p);
                }}
                disabled={events.length < 2}
                aria-label={playing ? "Pause" : "Lecture"}
                className="focus-ring grid h-6 w-6 place-items-center rounded-lg border border-cyan/40 bg-cyan/15 text-[10px] text-cyan transition-colors hover:bg-cyan/25 disabled:opacity-40"
              >
                {playing ? "❚❚" : "▶"}
              </button>
              <button
                type="button"
                onClick={() => setReplayOpen(false)}
                aria-label="Fermer le replay"
                className="focus-ring px-1 text-sm text-muted transition-colors hover:text-foreground"
              >
                ×
              </button>
            </div>
          </div>

          {events.length < 2 ? (
            <p className="mt-2 text-[11px] text-muted">
              Pas encore assez d&apos;activité à rejouer — laisse l&apos;équipe travailler.
            </p>
          ) : (
            <>
              {/* Timeline : marqueurs positionnés au prorata du temps. */}
              <div className="relative mt-3 h-5">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(234,240,248,0.12)]" />
                {events.map((evt, i) => {
                  const left = first ? ((evt.at - first.at) / span) * 100 : 0;
                  const color = evt.agentId ? AGENT_BY_ID[evt.agentId].color : "#7E8CA0";
                  const key = evt.kind === "done";
                  return (
                    <span
                      key={evt.id}
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${left}%`,
                        width: key ? 7 : 4,
                        height: key ? 7 : 4,
                        background: color,
                        opacity: i <= cursor ? 1 : 0.25,
                        boxShadow: i <= cursor && key ? `0 0 8px ${color}` : undefined,
                        transition: "opacity 0.2s",
                      }}
                    />
                  );
                })}
                <input
                  type="range"
                  min={0}
                  max={events.length - 1}
                  value={cursor}
                  onChange={(e) => {
                    setPlaying(false);
                    setCursor(Number(e.target.value));
                  }}
                  aria-label="Position dans la journée"
                  className="absolute inset-0 w-full cursor-pointer opacity-0"
                />
                {/* Curseur */}
                <span
                  className="pointer-events-none absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan"
                  style={{
                    left: `${first && current ? ((current.at - first.at) / span) * 100 : 0}%`,
                    boxShadow: "0 0 8px #5EE7FF",
                    transition: "left 0.2s",
                  }}
                />
              </div>

              {current ? (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-cyan tabular-nums">
                    {formatTime(current.at)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/90">
                    {current.message}
                  </span>
                  <span className="label-mono shrink-0 tabular-nums">
                    {cursor + 1}/{events.length}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
