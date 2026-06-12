"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  color?: string;
  run: () => void;
}

function PaletteInner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const tasks = useCrewStore((s) => s.tasks);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const commands = useMemo<Command[]>(() => {
    const s = useCrewStore.getState();
    const base: Command[] = [
      { id: "nav-scene", group: "Navigation", label: "Aller à la scène", hint: "vue diorama", run: () => router.push("/") },
      { id: "nav-board", group: "Navigation", label: "Aller au board", hint: "kanban", run: () => router.push("/board") },
      { id: "nav-projects", group: "Navigation", label: "Aller aux projets", hint: "progression", run: () => router.push("/projects") },
      { id: "chat", group: "Actions", label: "Parler à Atlas", hint: "décrire un besoin", run: () => { router.push("/"); s.setChatOpen(true); } },
      { id: "kanban-overlay", group: "Actions", label: "Ouvrir le kanban en panneau", run: () => { router.push("/"); s.setBoardOverlayOpen(true); } },
      { id: "replay", group: "Actions", label: "Ouvrir le replay de la journée", run: () => { router.push("/"); s.setReplayOpen(true); } },
      { id: "phase", group: "Actions", label: "Basculer l'éclairage jour/nuit", hint: `actuel : ${s.scenePhase}`, run: () => {
          const next = s.scenePhase === "auto" ? "day" : s.scenePhase === "day" ? "night" : "auto";
          s.setScenePhase(next);
        } },
      ...AGENTS.map((a) => ({
        id: `profil-${a.id}`,
        group: "Équipe",
        label: `Profil : ${a.name}`,
        hint: a.role,
        color: a.color,
        run: () => { router.push("/"); s.selectAgent(a.id); },
      })),
      ...AGENTS.map((a) => ({
        id: `former-${a.id}`,
        group: "Équipe",
        label: `Entraîner : ${a.name}`,
        hint: "skills & connaissances",
        color: a.color,
        run: () => s.setTrainingAgent(a.id),
      })),
      ...tasks
        .filter((t) => t.status !== "done")
        .slice(0, 30)
        .map((t) => ({
          id: `task-${t.id}`,
          group: "Tâches",
          label: t.status === "backlog" ? `Assigner : ${t.title}` : `Voir : ${t.title}`,
          hint: t.status === "backlog" ? "dispatch immédiat" : "au board",
          color: AGENTS.find((a) => a.id === t.agentId)?.color,
          run: () => {
            if (t.status === "backlog") useCrewStore.getState().dispatchTask(t.id);
            else router.push("/board");
          },
        })),
    ];
    return base;
  }, [router, tasks]);

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list =
      tokens.length === 0
        ? commands
        : commands.filter((c) => {
            const hay = `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase();
            return tokens.every((t) => hay.includes(t));
          });
    return list.slice(0, 9);
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  const exec = (cmd: Command | undefined) => {
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass mx-auto mt-24 w-[min(92vw,560px)] overflow-hidden rounded-2xl"
      role="dialog"
      aria-label="Palette de commandes"
    >
      <div className="flex items-center gap-2 border-b border-[rgba(234,240,248,0.07)] px-4 py-3">
        <span className="text-cyan" aria-hidden>
          ⌘
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              exec(filtered[active]);
            }
          }}
          placeholder="Assigner, chercher une tâche, changer de vue…"
          aria-label="Commande"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70"
        />
        <kbd className="label-mono rounded border border-[rgba(234,240,248,0.12)] px-1.5 py-0.5">
          Échap
        </kbd>
      </div>
      <ul className="thin-scroll max-h-[50dvh] overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-[11px] text-muted">Aucun résultat.</li>
        ) : (
          filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                type="button"
                onClick={() => exec(cmd)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
                  i === active ? "bg-[rgba(94,231,255,0.08)]" : ""
                }`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: cmd.color ?? "#7E8CA0",
                    boxShadow: cmd.color ? `0 0 6px ${cmd.color}` : undefined,
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {cmd.label}
                </span>
                {cmd.hint ? (
                  <span className="label-mono shrink-0">{cmd.hint}</span>
                ) : null}
                <span className="label-mono shrink-0 opacity-60">{cmd.group}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </motion.div>
  );
}

/** Command palette globale : ⌘K / Ctrl+K depuis n'importe quelle vue. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 bg-[rgba(7,9,14,0.6)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <div className="relative">
            <PaletteInner onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
