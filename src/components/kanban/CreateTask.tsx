"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentId } from "@/services/types";
import { AGENTS } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";

const SPECIALISTS = AGENTS.filter((a) => !a.isOrchestrator);

/** Ajout manuel d'une tâche au backlog (sans passer par le chat d'Atlas). */
export function CreateTask() {
  const createTask = useCrewStore((s) => s.createTask);
  const projects = useCrewStore((s) => s.projects);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agentId, setAgentId] = useState<AgentId>("pixel");
  const [estimate, setEstimate] = useState("20");
  const [tags, setTags] = useState("");
  const [projectId, setProjectId] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setAgentId("pixel");
    setEstimate("20");
    setTags("");
    setProjectId("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") return;
    createTask({
      title,
      description,
      agentId,
      estimateMin: Number(estimate) || 20,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      projectId: projectId || undefined,
    });
    reset();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nouvelle tâche</Button>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[65]" role="dialog" aria-modal aria-label="Nouvelle tâche">
            <motion.div
              className="absolute inset-0 bg-[rgba(7,9,14,0.6)] backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.form
              onSubmit={submit}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass absolute top-1/2 left-1/2 w-[min(94vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5"
            >
              <h2 className="font-display text-sm font-bold tracking-wide">Nouvelle tâche</h2>

              <label className="mt-4 block">
                <span className="label-mono">Titre</span>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="mt-3 block">
                <span className="label-mono">Consigne</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ce que l'agent doit produire…"
                  className="focus-ring mt-1 w-full resize-y rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted/60"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="label-mono">Agent</span>
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value as AgentId)}
                    className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-surface px-2 py-2 text-xs text-foreground"
                  >
                    {SPECIALISTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label-mono">Estimation (min)</span>
                  <input
                    type="number"
                    min={1}
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                    className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-xs text-foreground tabular-nums"
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="label-mono">Tags (séparés par des virgules)</span>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="design, ui"
                  className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60"
                />
              </label>

              {projects.length > 0 ? (
                <label className="mt-3 block">
                  <span className="label-mono">Projet (optionnel)</span>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-surface px-2 py-2 text-xs text-foreground"
                  >
                    <option value="">— Aucun —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.dir ? ` (${p.dir})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Annuler
                </Button>
                <Button variant="primary" disabled={title.trim() === ""}>
                  Créer
                </Button>
              </div>
            </motion.form>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
