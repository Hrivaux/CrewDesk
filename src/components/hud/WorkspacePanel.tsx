"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";
import { Button } from "@/components/ui/Button";

interface WorkspaceInfo {
  base: string;
  editable: boolean;
  locked: boolean;
}

/**
 * Dossier de travail : où les agents écrivent les projets sur le PC.
 * Affiche le chemin (copiable) et permet de le changer en local —
 * « comme Claude Code », tu pointes CrewDesk vers ton dossier de dev.
 */
export function WorkspacePanel() {
  const mounted = useMounted();
  const [info, setInfo] = useState<WorkspaceInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;
    void fetch("/api/workspace")
      .then((r) => r.json())
      .then((d: WorkspaceInfo) => setInfo(d))
      .catch(() => {});
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  if (!mounted || !info) return null;

  const save = async () => {
    setError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dir: draft }),
      });
      const data = (await res.json()) as { base?: string; error?: string };
      if (!res.ok || !data.base) throw new Error(data.error ?? "Échec");
      setInfo({ ...info, base: data.base });
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(info.base);
          setOpen((o) => !o);
        }}
        aria-label="Dossier de travail des agents"
        aria-expanded={open}
        title={info.base}
        className="focus-ring flex items-center gap-1.5 rounded-lg border border-[rgba(234,240,248,0.1)] px-2.5 py-1 transition-colors hover:bg-[rgba(234,240,248,0.05)]"
      >
        <span aria-hidden>📁</span>
        <span className="hidden max-w-40 truncate font-mono text-[10px] text-foreground/85 sm:inline">
          {info.base}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass absolute top-9 right-0 z-50 w-80 rounded-xl p-3"
          >
            <p className="label-mono">Dossier de travail des agents</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              En local, les agents écrivent ici de vrais fichiers — ouvre ce dossier
              pendant le dev, comme avec Claude Code.
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <code className="thin-scroll min-w-0 flex-1 overflow-x-auto rounded-lg border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-2 py-1.5 font-mono text-[10px] whitespace-nowrap text-cyan">
                {info.base}
              </code>
              <Button
                onClick={() => {
                  void navigator.clipboard.writeText(info.base);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "✓" : "Copier"}
              </Button>
            </div>

            {info.editable ? (
              <>
                <p className="label-mono mt-3">Changer de dossier (chemin absolu)</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="/Users/moi/Projets"
                    aria-label="Nouveau dossier de travail"
                    className="focus-ring min-w-0 flex-1 rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-2 py-1.5 font-mono text-[10px] text-foreground"
                  />
                  <Button variant="primary" onClick={() => void save()}>
                    Définir
                  </Button>
                </div>
                {error ? (
                  <p className="mt-1.5 text-[10px] text-[#FF8A4C]">{error}</p>
                ) : null}
                <p className="mt-1.5 text-[10px] text-muted">
                  Les nouveaux projets iront dans ce dossier.
                </p>
              </>
            ) : (
              <p className="mt-3 text-[10px] text-muted">
                {info.locked
                  ? "Fixé par la variable d'environnement CREWDESK_WORKSPACE."
                  : "Dossier géré par le serveur (mode multi-utilisateur)."}
              </p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
