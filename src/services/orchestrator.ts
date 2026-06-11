"use client";

import { useEffect } from "react";
import type { AgentId, IOrchestrator, Plan, PlannedTask, Task } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";

/* -------------------------------------------------------------------------- */
/*  SimulatedOrchestrator — mock intelligent, remplacé en v2 par               */
/*  ClaudeOrchestrator (API Anthropic) derrière la même interface.             */
/* -------------------------------------------------------------------------- */

interface DomainTemplate {
  keywords: string[];
  summary: string;
  tasks: PlannedTask[];
}

const DOMAINS: DomainTemplate[] = [
  {
    keywords: ["landing", "site", "page", "web", "app", "application"],
    summary: "Création d'un site web : recherche, design, intégration, contenu et lancement.",
    tasks: [
      { title: "Benchmark des sites concurrents", description: "Analyser 5 sites de référence : structure, ton, parcours de conversion.", agentId: "sonar", estimateMin: 25, tags: ["recherche"] },
      { title: "Maquette de la page d'accueil", description: "Hero, preuves sociales, pricing, FAQ — direction artistique premium.", agentId: "pixel", estimateMin: 45, tags: ["design"], dependsOn: [0] },
      { title: "Intégration responsive", description: "Intégrer la maquette en HTML/CSS avec animations légères.", agentId: "forge", estimateMin: 50, tags: ["dev"], dependsOn: [1] },
      { title: "Rédaction des textes", description: "Titres, sous-titres, CTA et microcopy orientés conversion.", agentId: "plume", estimateMin: 30, tags: ["contenu"], dependsOn: [0] },
      { title: "Plan de lancement", description: "Checklist de mise en ligne et calendrier d'annonce sur les réseaux.", agentId: "vega", estimateMin: 20, tags: ["marketing"], dependsOn: [2, 3] },
    ],
  },
  {
    keywords: ["article", "blog", "contenu", "newsletter", "texte"],
    summary: "Production de contenu : recherche du sujet, rédaction, visuels et diffusion.",
    tasks: [
      { title: "Recherche documentaire", description: "Sources fiables, chiffres clés et angles différenciants.", agentId: "sonar", estimateMin: 20, tags: ["recherche"] },
      { title: "Rédaction du brouillon", description: "Structure, rédaction complète et relecture orthographique.", agentId: "plume", estimateMin: 40, tags: ["contenu"], dependsOn: [0] },
      { title: "Visuels d'illustration", description: "Image de couverture et schémas d'appui.", agentId: "pixel", estimateMin: 25, tags: ["design"], dependsOn: [1] },
      { title: "Plan de diffusion", description: "Déclinaison réseaux sociaux et newsletter.", agentId: "vega", estimateMin: 15, tags: ["marketing"], dependsOn: [1] },
    ],
  },
  {
    keywords: ["étude", "analyse", "marché", "concurrent", "veille", "recherche"],
    summary: "Étude et analyse : collecte, synthèse, restitution visuelle.",
    tasks: [
      { title: "Collecte des données", description: "Cartographier les acteurs et rassembler les données publiques.", agentId: "sonar", estimateMin: 35, tags: ["recherche"] },
      { title: "Synthèse rédigée", description: "Note de synthèse claire avec recommandations.", agentId: "plume", estimateMin: 25, tags: ["contenu"], dependsOn: [0] },
      { title: "Datavisualisation", description: "Graphiques et tableau comparatif lisibles.", agentId: "pixel", estimateMin: 20, tags: ["design"], dependsOn: [0] },
      { title: "Présentation des conclusions", description: "Slides de restitution et prochaines étapes.", agentId: "vega", estimateMin: 20, tags: ["planning"], dependsOn: [1, 2] },
    ],
  },
];

const FALLBACK: DomainTemplate = {
  keywords: [],
  summary: "Projet générique : cadrage, exécution, vérification et restitution.",
  tasks: [
    { title: "Cadrage du besoin", description: "Clarifier l'objectif, les contraintes et les livrables.", agentId: "sonar", estimateMin: 15, tags: ["recherche"] },
    { title: "Réalisation principale", description: "Produire le livrable central du projet.", agentId: "forge", estimateMin: 45, tags: ["dev"], dependsOn: [0] },
    { title: "Relecture et finitions", description: "Contrôle qualité et polissage final.", agentId: "plume", estimateMin: 20, tags: ["contenu"], dependsOn: [1] },
  ],
};

let planSeq = 0;

export class SimulatedOrchestrator implements IOrchestrator {
  async plan(request: string): Promise<Plan> {
    const lower = request.toLowerCase();
    const domain =
      DOMAINS.find((d) => d.keywords.some((k) => lower.includes(k))) ?? FALLBACK;
    planSeq += 1;
    return {
      id: `plan_${Date.now().toString(36)}_${planSeq}`,
      request,
      summary: domain.summary,
      tasks: domain.tasks,
    };
  }
}

export const orchestrator: IOrchestrator = new SimulatedOrchestrator();

/* -------------------------------------------------------------------------- */
/*  Simulation — fait vivre la scène : dispatch, progression, rotation.        */
/* -------------------------------------------------------------------------- */

const SEED_BATCHES: ReadonlyArray<ReadonlyArray<Omit<Task, "id" | "status" | "progress" | "createdAt">>> = [
  [
    { title: "Maquette du dashboard analytics", description: "Vue d'ensemble avec graphiques temps réel et mode sombre.", agentId: "pixel", estimateMin: 18, tags: ["design", "ui"] },
    { title: "API de synchronisation kanban", description: "Endpoints REST pour créer et déplacer les cartes.", agentId: "forge", estimateMin: 24, tags: ["dev", "api"] },
    { title: "Analyse concurrentielle", description: "Benchmark des 5 outils de gestion d'agents IA du marché.", agentId: "sonar", estimateMin: 15, tags: ["recherche"] },
    { title: "Page « Fonctionnalités » du site", description: "Rédaction orientée bénéfices, ton premium.", agentId: "plume", estimateMin: 12, tags: ["contenu"] },
    { title: "Calendrier de lancement bêta", description: "Jalons, liste d'attente et séquence d'emails.", agentId: "vega", estimateMin: 14, tags: ["planning"] },
    { title: "Icônes du design system", description: "Set de 24 icônes cohérentes, grille 24px.", agentId: "pixel", estimateMin: 16, tags: ["design"] },
    { title: "Optimisation des requêtes", description: "Réduire le temps de réponse médian sous 80 ms.", agentId: "forge", estimateMin: 20, tags: ["dev", "perf"] },
  ],
  [
    { title: "Sondage utilisateurs bêta", description: "Questionnaire de satisfaction et analyse des verbatims.", agentId: "sonar", estimateMin: 14, tags: ["recherche"] },
    { title: "Newsletter de juin", description: "Annonce des nouveautés et étude de cas client.", agentId: "plume", estimateMin: 12, tags: ["contenu"] },
    { title: "Animations d'onboarding", description: "Micro-interactions du premier lancement.", agentId: "pixel", estimateMin: 18, tags: ["design", "motion"] },
    { title: "Tests end-to-end du kanban", description: "Couvrir le drag & drop et la synchronisation temps réel.", agentId: "forge", estimateMin: 22, tags: ["dev", "tests"] },
    { title: "Plan réseaux sociaux S26", description: "Calendrier éditorial et visuels associés.", agentId: "vega", estimateMin: 12, tags: ["marketing"] },
    { title: "Veille tarification SaaS", description: "Modèles de pricing des concurrents directs.", agentId: "sonar", estimateMin: 13, tags: ["recherche"] },
  ],
];

let taskSeq = 0;
function makeTask(t: Omit<Task, "id" | "status" | "progress" | "createdAt">): Task {
  taskSeq += 1;
  return {
    ...t,
    tags: [...t.tags],
    id: `task_${Date.now().toString(36)}_${taskSeq.toString(36)}`,
    status: "backlog",
    progress: 0,
    createdAt: Date.now(),
  };
}

const TICK_MS = 600;
const DISPATCH_COOLDOWN_MS = 3200;
/** 1 minute estimée ≈ 1,4 s de simulation. */
const SIM_MS_PER_MIN = 1400;

export function startSimulation(): () => void {
  const store = useCrewStore;
  let lastDispatch = 0;
  let emptySince: number | null = null;
  let batchIndex = 0;

  // Seed initial si le backlog est vide au premier lancement.
  if (store.getState().tasks.length === 0) {
    const batch = SEED_BATCHES[0];
    if (batch) store.getState().seedTasks(batch.map(makeTask));
  }

  const interval = window.setInterval(() => {
    const now = Date.now();
    const s = store.getState();

    // 1. Transitions de déplacement (arrivée au poste / retour en zone pause).
    for (const rt of Object.values(s.agents)) {
      if (rt.pose && now >= rt.pose.startedAt + rt.pose.duration) {
        if (rt.status === "walking") s.beginWork(rt.id);
        else if (rt.status === "returning") s.settleAgent(rt.id);
      }
    }

    // 2. Progression des tâches en cours.
    const fresh = store.getState();
    for (const task of fresh.tasks) {
      if (task.status !== "in_progress") continue;
      const totalMs = task.estimateMin * SIM_MS_PER_MIN;
      const delta = (TICK_MS / totalMs) * 100 * (0.7 + Math.random() * 0.6);
      const next = task.progress + delta;
      if (next >= 100) fresh.finishTask(task.id);
      else fresh.setTaskProgress(task.id, next);
    }

    // 3. Dispatch : Atlas assigne une tâche du backlog à un spécialiste libre.
    const cur = store.getState();
    if (now - lastDispatch >= DISPATCH_COOLDOWN_MS) {
      const next = cur.tasks.find(
        (t) => t.status === "backlog" && cur.agents[t.agentId].status === "idle",
      );
      if (next) {
        cur.dispatchTask(next.id);
        lastDispatch = now;
      }
    }

    // 4. Backlog épuisé et équipe au repos : nouvelle vague après une pause.
    const after = store.getState();
    const pending = after.tasks.some((t) => t.status !== "done");
    if (!pending && after.tasks.length > 0) {
      if (emptySince === null) emptySince = now;
      if (now - emptySince > 7000) {
        batchIndex = (batchIndex + 1) % SEED_BATCHES.length;
        const batch = SEED_BATCHES[batchIndex];
        if (batch) after.seedTasks(batch.map(makeTask));
        emptySince = null;
      }
    } else {
      emptySince = null;
    }
  }, TICK_MS);

  return () => window.clearInterval(interval);
}

/** Démarre la simulation côté client (une seule instance). */
export function useSimulation(): void {
  useEffect(() => startSimulation(), []);
}
