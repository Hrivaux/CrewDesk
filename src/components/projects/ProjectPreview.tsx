"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";

/** Aperçu du projet : le site produit par les agents, servi dans une iframe. */
export function ProjectPreview() {
  const previewProject = useCrewStore((s) => s.previewProject);
  const setPreviewProject = useCrewStore((s) => s.setPreviewProject);
  const projects = useCrewStore((s) => s.projects);
  const project = previewProject
    ? projects.find((p) => p.id === previewProject)
    : undefined;
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!previewProject) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewProject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewProject, setPreviewProject]);

  const url = project?.dir ? `/api/preview/${project.dir}/` : null;

  return (
    <AnimatePresence>
      {project && url ? (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal
          aria-label={`Aperçu de ${project.name}`}
        >
          <motion.div
            className="absolute inset-0 bg-[rgba(7,9,14,0.65)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewProject(null)}
          />
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass absolute inset-4 flex flex-col overflow-hidden rounded-2xl md:inset-8"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[rgba(234,240,248,0.07)] px-4 py-2.5">
              <div className="flex min-w-0 items-baseline gap-2">
                <h2 className="truncate font-display text-sm font-bold tracking-wide">
                  {project.name}
                </h2>
                <span className="label-mono hidden sm:inline">{project.dir}/</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button onClick={() => setReloadKey((k) => k + 1)}>⟳ Recharger</Button>
                <a
                  href={`/api/export/${project.dir}`}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/15 px-3 py-1.5 font-display text-xs font-semibold text-cyan transition-colors hover:bg-cyan/25"
                >
                  ⬇ Télécharger .zip
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[rgba(234,240,248,0.12)] px-3 py-1.5 font-display text-xs font-semibold transition-colors hover:bg-[rgba(234,240,248,0.06)]"
                >
                  Ouvrir ↗
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewProject(null)}
                  aria-label="Fermer l'aperçu"
                  className="focus-ring px-2 text-base text-muted transition-colors hover:text-foreground"
                >
                  ×
                </button>
              </div>
            </header>
            <iframe
              key={reloadKey}
              src={url}
              title={`Aperçu de ${project.name}`}
              sandbox="allow-scripts allow-same-origin"
              className="min-h-0 flex-1 bg-white"
            />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
