"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentSkill } from "@/services/types";
import { AGENT_BY_ID } from "@/lib/agents";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

const EMPTY_FORM = { kind: "skill" as AgentSkill["kind"], name: "", description: "", content: "" };

const HINTS: Record<string, string> = {
  pixel: "Ex. : ta charte graphique (couleurs, typos), tes références design, tes règles d'accessibilité…",
  forge: "Ex. : tes conventions de code, ta stack préférée, des snippets maison, tes règles de structure…",
  sonar: "Ex. : tes sources fiables, ta méthode d'analyse, des données sur ton marché…",
  plume: "Ex. : ton ton éditorial, tes formules interdites, des exemples de textes que tu aimes…",
  vega: "Ex. : tes canaux marketing, ton audience, tes contraintes de calendrier…",
  atlas: "Ex. : tes préférences de planification (toujours une tâche SEO, stack imposée, granularité des tâches)…",
};

function SkillEditor({
  initial,
  onSave,
  onCancel,
  hint,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (form: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  hint?: string;
}) {
  const [form, setForm] = useState(initial);
  const valid = form.name.trim() !== "" && form.content.trim() !== "";

  return (
    <div className="rounded-xl border border-cyan/25 bg-[rgba(94,231,255,0.04)] p-3">
      <div className="flex items-center gap-2">
        <select
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value as AgentSkill["kind"] })}
          aria-label="Type"
          className="focus-ring rounded border border-[rgba(234,240,248,0.12)] bg-surface px-1.5 py-1 font-mono text-[9px] tracking-[0.08em] text-cyan uppercase"
        >
          <option value="skill">Skill</option>
          <option value="connaissance">Connaissance</option>
        </select>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nom (ex. Charte graphique NeoBrand)"
          maxLength={80}
          aria-label="Nom"
          className="focus-ring min-w-0 flex-1 rounded-lg border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted/60"
        />
      </div>
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Quand l'appliquer (optionnel)"
        maxLength={160}
        aria-label="Quand l'appliquer"
        className="focus-ring mt-2 w-full rounded-lg border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted/60"
      />
      <textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder={hint ?? "Contenu injecté dans le prompt de l'agent (markdown)…"}
        rows={8}
        maxLength={12000}
        aria-label="Contenu"
        className="focus-ring mt-2 w-full resize-y rounded-lg border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-2.5 py-2 font-mono text-[11px] leading-relaxed text-foreground placeholder:font-body placeholder:text-muted/60"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted tabular-nums">
          {form.content.length} / 12 000
        </span>
        <div className="flex gap-1.5">
          <Button onClick={onCancel}>Annuler</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(form)}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Panneau d'entraînement : skills & connaissances propres à chaque agent. */
export function AgentTraining() {
  const trainingAgent = useCrewStore((s) => s.trainingAgent);
  const setTrainingAgent = useCrewStore((s) => s.setTrainingAgent);
  const allSkills = useCrewStore((s) => s.skills);
  const skills = trainingAgent
    ? allSkills.filter((sk) => sk.agentId === trainingAgent)
    : [];
  const addSkill = useCrewStore((s) => s.addSkill);
  const updateSkill = useCrewStore((s) => s.updateSkill);
  const toggleSkill = useCrewStore((s) => s.toggleSkill);
  const removeSkill = useCrewStore((s) => s.removeSkill);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  useEffect(() => setEditing(null), [trainingAgent]);

  useEffect(() => {
    if (!trainingAgent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrainingAgent(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trainingAgent, setTrainingAgent]);

  const def = trainingAgent ? AGENT_BY_ID[trainingAgent] : null;

  return (
    <AnimatePresence>
      {def ? (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal
          aria-label={`Entraînement de ${def.name}`}
        >
          <motion.div
            className="absolute inset-0 bg-[rgba(7,9,14,0.6)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTrainingAgent(null)}
          />
          <motion.aside
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="glass absolute top-0 right-0 flex h-full w-[min(96vw,560px)] flex-col rounded-l-2xl"
          >
            <header className="border-b border-[rgba(234,240,248,0.07)] px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-ink"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${def.color} 40%, white), ${def.color})`,
                    boxShadow: `0 0 16px ${def.color}66`,
                  }}
                >
                  {def.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-sm font-bold tracking-wide">
                    Entraînement de {def.name}
                  </h2>
                  <p className="label-mono mt-0.5">
                    {def.role} · injecté dans chacune de ses missions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrainingAgent(null)}
                  aria-label="Fermer"
                  className="focus-ring text-base text-muted transition-colors hover:text-foreground"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {skills.length === 0 && editing !== "new" ? (
                <div className="rounded-xl border border-dashed border-[rgba(234,240,248,0.12)] px-4 py-6 text-center">
                  <p className="text-xs leading-relaxed text-muted">
                    Aucun entraînement pour l&apos;instant.
                    <br />
                    {HINTS[def.id]}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-2.5">
                {skills.map((skill) =>
                  editing === skill.id ? (
                    <SkillEditor
                      key={skill.id}
                      initial={{
                        kind: skill.kind,
                        name: skill.name,
                        description: skill.description ?? "",
                        content: skill.content,
                      }}
                      hint={HINTS[def.id]}
                      onCancel={() => setEditing(null)}
                      onSave={(form) => {
                        updateSkill(skill.id, {
                          kind: form.kind,
                          name: form.name.trim(),
                          description: form.description.trim() || undefined,
                          content: form.content,
                        });
                        setEditing(null);
                      }}
                    />
                  ) : (
                    <div
                      key={skill.id}
                      className={`rounded-xl border px-3 py-2.5 transition-opacity ${
                        skill.enabled
                          ? "border-[rgba(234,240,248,0.1)] bg-[rgba(16,22,31,0.6)]"
                          : "border-[rgba(234,240,248,0.06)] bg-[rgba(16,22,31,0.3)] opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Chip color={skill.kind === "skill" ? def.color : "#7E8CA0"}>
                          {skill.kind}
                        </Chip>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {skill.name}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={skill.enabled}
                          aria-label={`Activer ${skill.name}`}
                          onClick={() => toggleSkill(skill.id)}
                          className={`focus-ring relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                            skill.enabled ? "bg-cyan/60" : "bg-[rgba(234,240,248,0.15)]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-3 w-3 rounded-full bg-foreground transition-[left] ${
                              skill.enabled ? "left-3.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      {skill.description ? (
                        <p className="mt-1 text-[10px] text-muted italic">{skill.description}</p>
                      ) : null}
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-foreground/70">
                        {skill.content}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted tabular-nums">
                          {skill.content.length} caractères
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(skill.id)}
                            className="focus-ring label-mono transition-colors hover:text-foreground"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.id)}
                            className="focus-ring label-mono transition-colors hover:text-[#FF8A4C]"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {editing === "new" ? (
                  <SkillEditor
                    initial={EMPTY_FORM}
                    hint={HINTS[def.id]}
                    onCancel={() => setEditing(null)}
                    onSave={(form) => {
                      addSkill({
                        agentId: def.id,
                        kind: form.kind,
                        name: form.name.trim(),
                        description: form.description.trim() || undefined,
                        content: form.content,
                      });
                      setEditing(null);
                    }}
                  />
                ) : null}
              </div>
            </div>

            <footer className="border-t border-[rgba(234,240,248,0.07)] px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="label-mono">
                  {skills.filter((s) => s.enabled).length} actif
                  {skills.filter((s) => s.enabled).length > 1 ? "s" : ""} / {skills.length}
                </span>
                {editing !== "new" ? (
                  <Button variant="primary" onClick={() => setEditing("new")}>
                    + Ajouter un entraînement
                  </Button>
                ) : null}
              </div>
            </footer>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
