"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENT_BY_ID } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Markdown } from "@/components/ui/Markdown";

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  assigned: "Assigné",
  in_progress: "En cours",
  review: "Revue",
  done: "Terminé",
};

/** Détail d'une tâche : consigne, prérequis, et surtout le livrable produit. */
export function TaskDetail() {
  const selectedTask = useCrewStore((s) => s.selectedTask);
  const setSelectedTask = useCrewStore((s) => s.setSelectedTask);
  const tasks = useCrewStore((s) => s.tasks);
  const projects = useCrewStore((s) => s.projects);
  const workspaceBase = useCrewStore((s) => s.workspaceBase);
  const task = selectedTask ? tasks.find((t) => t.id === selectedTask) : undefined;
  const project = task?.projectId
    ? projects.find((p) => p.id === task.projectId)
    : undefined;
  const deps = task?.dependsOnIds
    ? tasks.filter((t) => task.dependsOnIds?.includes(t.id))
    : [];
  const requestRevision = useCrewStore((s) => s.requestRevision);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!selectedTask) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTask(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTask, setSelectedTask]);

  useEffect(() => {
    setCopied(false);
    setFeedback("");
  }, [selectedTask]);

  const def = task ? AGENT_BY_ID[task.agentId] : null;

  return (
    <AnimatePresence>
      {task && def ? (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal aria-label={task.title}>
          <motion.div
            className="absolute inset-0 bg-[rgba(7,9,14,0.6)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTask(null)}
          />
          <motion.aside
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="glass absolute top-0 right-0 flex h-full w-[min(96vw,680px)] flex-col rounded-l-2xl"
          >
            <header className="border-b border-[rgba(234,240,248,0.07)] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-sm leading-snug font-bold">{task.title}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  aria-label="Fermer"
                  className="focus-ring -mt-0.5 text-base text-muted transition-colors hover:text-foreground"
                >
                  ×
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Chip color={def.color}>
                  {def.name} · {def.role}
                </Chip>
                <Chip>{STATUS_LABEL[task.status] ?? task.status}</Chip>
                <Chip>~{task.estimateMin} min</Chip>
                {project ? <Chip color={project.color}>◆ {project.name}</Chip> : null}
              </div>
            </header>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="label-mono">Consigne</p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">
                {task.description}
              </p>

              {deps.length > 0 ? (
                <>
                  <p className="label-mono mt-4">Prérequis</p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {deps.map((dep) => (
                      <li key={dep.id} className="flex items-center gap-2 text-[11px]">
                        <span
                          style={{ color: dep.status === "done" ? "#3CDFA0" : "#FFB35C" }}
                        >
                          {dep.status === "done" ? "✓" : "…"}
                        </span>
                        <button
                          type="button"
                          className="focus-ring truncate text-left text-foreground/85 underline-offset-2 hover:underline"
                          onClick={() => setSelectedTask(dep.id)}
                        >
                          {dep.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {task.files && task.files.length > 0 ? (
                <>
                  <p className="label-mono mt-4">
                    Fichiers ({task.files.length})
                    {project?.dir && workspaceBase ? (
                      <span className="ml-2 normal-case tracking-normal text-muted/70">
                        — {workspaceBase}/{project.dir}
                      </span>
                    ) : null}
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {task.files.map((file) => (
                      <li
                        key={file}
                        className="rounded border border-[rgba(94,231,255,0.2)] bg-[rgba(94,231,255,0.05)] px-1.5 py-0.5 font-mono text-[10px] text-cyan"
                      >
                        {file}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {task.error ? (
                <div className="mt-4 rounded-lg border border-[rgba(255,138,76,0.35)] bg-[rgba(255,138,76,0.07)] px-3 py-2">
                  <p className="label-mono" style={{ color: "#FF8A4C" }}>
                    Dernière erreur
                  </p>
                  <p className="mt-1 text-[11px] text-foreground/85">{task.error}</p>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="label-mono">Rapport de l&apos;agent</p>
                {task.deliverable ? (
                  <Button
                    onClick={() => {
                      void navigator.clipboard.writeText(task.deliverable ?? "");
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    }}
                  >
                    {copied ? "Copié ✓" : "Copier"}
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 pb-2">
                {task.deliverable ? (
                  <Markdown text={task.deliverable} />
                ) : (
                  <p className="rounded-lg border border-dashed border-[rgba(234,240,248,0.1)] px-3 py-5 text-center text-[11px] text-muted">
                    {task.status === "in_progress"
                      ? `${def.name} travaille dessus…`
                      : "Pas encore de rapport — il apparaîtra ici quand l'agent aura terminé."}
                  </p>
                )}
              </div>

              {task.deliverable &&
              (task.status === "review" || task.status === "done") ? (
                <div className="mb-4 rounded-xl border border-[rgba(255,179,92,0.25)] bg-[rgba(255,179,92,0.05)] p-3">
                  <p className="label-mono" style={{ color: "#FFB35C" }}>
                    Demander une retouche
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    maxLength={4000}
                    placeholder={`Dis à ${def.name} ce qui doit changer — il reprendra son travail avec ton retour.`}
                    aria-label="Retour pour la retouche"
                    className="focus-ring mt-2 w-full resize-y rounded-lg border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-2.5 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted/60"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="primary"
                      disabled={feedback.trim() === ""}
                      onClick={() => {
                        requestRevision(task.id, feedback);
                        setFeedback("");
                      }}
                    >
                      Envoyer à {def.name}
                    </Button>
                  </div>
                </div>
              ) : null}
              {task.revisionNote && task.status !== "review" && task.status !== "done" ? (
                <div className="mb-4 rounded-lg border border-[rgba(255,179,92,0.25)] bg-[rgba(255,179,92,0.05)] px-3 py-2">
                  <p className="label-mono" style={{ color: "#FFB35C" }}>
                    Retouche en cours
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/85">
                    {task.revisionNote}
                  </p>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
