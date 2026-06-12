"use client";

import { useEffect } from "react";
import type {
  AgentId,
  AgentSkill,
  AtlasReply,
  IOrchestrator,
  Plan,
  PlannedTask,
  Project,
  Task,
} from "@/services/types";
import { AGENT_BY_ID } from "@/lib/agents";
import { slugify } from "@/lib/slug";
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
    keywords: ["email", "emailing", "mailing", "séquence", "sequence", "onboarding"],
    summary: "Campagne d'emailing : segmentation, rédaction, design, automatisation et planification.",
    tasks: [
      { title: "Segmentation de l'audience", description: "Définir les segments et les déclencheurs de chaque email.", agentId: "sonar", estimateMin: 18, tags: ["recherche"] },
      { title: "Rédaction de la séquence", description: "5 emails : accroche, valeur, objections, preuve, offre.", agentId: "plume", estimateMin: 35, tags: ["contenu"], dependsOn: [0] },
      { title: "Template email responsive", description: "Design sobre, lisible en mode sombre et clair.", agentId: "pixel", estimateMin: 22, tags: ["design"] },
      { title: "Automatisation des envois", description: "Brancher la séquence sur les événements produit.", agentId: "forge", estimateMin: 25, tags: ["dev"], dependsOn: [1, 2] },
      { title: "Calendrier et A/B tests", description: "Cadence d'envoi et variantes d'objets à tester.", agentId: "vega", estimateMin: 15, tags: ["planning"], dependsOn: [1] },
    ],
  },
  {
    keywords: ["événement", "evenement", "webinaire", "conférence", "conference", "meetup", "lancement"],
    summary: "Organisation d'événement : cadrage, rétroplanning, inscription, visuels et communication.",
    tasks: [
      { title: "Benchmark d'événements similaires", description: "Formats, durées et taux de participation observés.", agentId: "sonar", estimateMin: 20, tags: ["recherche"] },
      { title: "Rétroplanning détaillé", description: "Jalons, responsabilités et points de contrôle.", agentId: "vega", estimateMin: 22, tags: ["planning"], dependsOn: [0] },
      { title: "Page d'inscription", description: "Formulaire, confirmation et rappels automatiques.", agentId: "forge", estimateMin: 28, tags: ["dev"], dependsOn: [1] },
      { title: "Kit visuel de l'événement", description: "Bannières, visuels réseaux et écran d'accueil.", agentId: "pixel", estimateMin: 24, tags: ["design"], dependsOn: [1] },
      { title: "Communications avant/après", description: "Annonces, relances et email de remerciement.", agentId: "plume", estimateMin: 20, tags: ["contenu"], dependsOn: [1] },
    ],
  },
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

const STOPWORDS = new Set([
  "je", "tu", "on", "nous", "vous", "veux", "voudrais", "aimerais", "souhaite",
  "peux", "dois", "lancer", "lance", "créer", "cree", "crée", "faire", "fais",
  "prépare", "prepare", "organise", "organiser", "mettre", "besoin", "aide",
  "stp", "svp", "un", "une", "le", "la", "les", "des", "de", "du", "et", "ou",
  "à", "a", "au", "aux", "pour", "sur", "avec", "dans", "mon", "ma", "mes",
  "ton", "ta", "tes", "son", "sa", "ses", "notre", "nos", "votre", "vos",
  "ce", "cet", "cette", "ces", "que", "qui", "est", "sont", "ne", "pas",
  "plus", "très", "tres", "aussi", "nouveau", "nouvelle", "petit", "petite",
]);

/** Extrait le sujet d'une demande en langage naturel (« app de fitness »…). */
export function extractTopic(request: string): string {
  const words = request
    .toLowerCase()
    .replace(/[«»"'’,.;:!?()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  if (words.length === 0) return "Nouveau projet";
  const topic = words.slice(0, 5).join(" ");
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

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
      // Copie défensive : le plan en attente est éditable dans le chat.
      tasks: domain.tasks.map((t) => ({ ...t, tags: [...t.tags] })),
    };
  }
}

export const orchestrator: IOrchestrator = new SimulatedOrchestrator();

/* -------------------------------------------------------------------------- */
/*  Pipeline du chat : Atlas analyse, propose un plan, puis le déploie.        */
/* -------------------------------------------------------------------------- */

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Entraînements actifs d'un agent, au format attendu par les routes API. */
function activeSkills(agentId: AgentId): Array<{
  kind: AgentSkill["kind"];
  name: string;
  description?: string;
  content: string;
}> {
  return useCrewStore
    .getState()
    .skills.filter((s) => s.agentId === agentId && s.enabled)
    .map((s) => ({
      kind: s.kind,
      name: s.name,
      description: s.description,
      content: s.content,
    }));
}

const PROJECT_COLORS = ["#5EE7FF", "#A777FF", "#3CDFA0", "#FFC94D", "#FF8A4C", "#4D8DFF"];

/**
 * L'utilisateur décrit son besoin. En mode live, Atlas (API Anthropic) pose
 * ses questions de cadrage puis propose un plan ; en simulation, le mock
 * répond instantanément avec un plan par mots-clés.
 */
export async function askAtlas(request: string): Promise<void> {
  const store = useCrewStore.getState();
  store.addChatMessage({ role: "user", text: request });
  useCrewStore.getState().setPendingPlan(null);
  useCrewStore.getState().setPlanning(true);

  if (!useCrewStore.getState().liveMode) {
    await wait(1300 + Math.random() * 900);
    const plan = await orchestrator.plan(request);
    const topic = extractTopic(request);
    const s = useCrewStore.getState();
    s.setPlanning(false);
    s.setPendingPlan(plan);
    s.addChatMessage({
      role: "atlas",
      text: `Voici ce que je propose pour « ${topic} » — ${plan.tasks.length} tâches réparties sur l'équipe. Ajuste ce qu'il faut, puis valide.`,
      planId: plan.id,
    });
    return;
  }

  try {
    const history = useCrewStore.getState().chatMessages.map((m) => ({
      role: m.role === "atlas" ? ("assistant" as const) : ("user" as const),
      content: m.planId
        ? `${m.text}\n\n[Un plan a été proposé à l'utilisateur dans l'interface.]`
        : m.text,
    }));
    // Atlas reçoit son propre entraînement + un résumé de ceux de l'équipe.
    const allSkills = useCrewStore.getState().skills.filter((s) => s.enabled);
    const teamSkills: Partial<Record<string, string[]>> = {};
    for (const skill of allSkills) {
      if (skill.agentId === "atlas") continue;
      (teamSkills[skill.agentId] ??= []).push(skill.name);
    }
    const res = await fetch("/api/atlas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: history,
        skills: activeSkills("atlas"),
        teamSkills,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as
      | AtlasReply
      | { error?: string };
    if (!res.ok || !("type" in data)) {
      throw new Error(
        ("error" in data ? data.error : undefined) ?? `HTTP ${res.status}`,
      );
    }
    const s = useCrewStore.getState();
    s.setPlanning(false);
    if (data.usage) registerSpend(data.usage);
    if (data.type === "plan") {
      s.setPendingPlan(data.plan);
      s.addChatMessage({
        role: "atlas",
        text:
          data.text ||
          `Voici le plan que je propose — ${data.plan.tasks.length} tâches. Ajuste si besoin, puis valide.`,
        planId: data.plan.id,
      });
    } else {
      s.addChatMessage({ role: "atlas", text: data.text });
    }
  } catch (error) {
    const s = useCrewStore.getState();
    s.setPlanning(false);
    s.addChatMessage({
      role: "atlas",
      text: `Impossible de joindre le serveur (${
        error instanceof Error ? error.message : "erreur inconnue"
      }). Vérifie la clé API puis réessaie.`,
    });
  }
}

/** Validation : projet créé, cartes une par une, dispatch en cascade. */
export async function validatePlan(): Promise<void> {
  const store = useCrewStore.getState();
  const plan = store.pendingPlan;
  if (!plan || plan.tasks.length === 0) return;
  const live = store.liveMode;

  const color =
    PROJECT_COLORS[store.projects.length % PROJECT_COLORS.length] ?? "#5EE7FF";
  const name = plan.projectName ?? extractTopic(plan.request);
  // Dossier unique sur le disque pour ce projet (mode live).
  const baseSlug = slugify(name);
  const taken = new Set(store.projects.map((p) => p.dir));
  let dir = baseSlug;
  for (let i = 2; taken.has(dir); i++) dir = `${baseSlug}-${i}`;

  const project: Project = {
    id: `proj_${Date.now().toString(36)}`,
    name,
    objective: plan.request,
    color,
    deadline: Date.now() + 14 * DAY_MS,
    createdAt: Date.now(),
    dir: live ? dir : undefined,
  };

  store.setPendingPlan(null);
  store.seedProjects([project]);
  store.pulseAtlas();
  const base = store.workspaceBase;
  store.addChatMessage({
    role: "atlas",
    text: live
      ? `C'est parti. Je crée le projet « ${project.name} » — l'équipe travaillera dans ${
          base ? `${base}/${dir}` : `le dossier ${dir}`
        }. Je briefe tout le monde…`
      : `C'est parti. Je crée le projet « ${project.name} » et je briefe l'équipe…`,
  });

  // Construit toutes les tâches d'abord pour résoudre les dépendances
  // (indices du plan → ids), puis création séquencée sous les yeux.
  const tasks = plan.tasks.map((t) =>
    makeTask({
      title: t.title,
      description: t.description,
      agentId: t.agentId,
      estimateMin: t.estimateMin,
      tags: t.tags,
      projectId: project.id,
      source: live ? "live" : "sim",
    }),
  );
  plan.tasks.forEach((t, i) => {
    const target = tasks[i];
    if (!target || !t.dependsOn?.length) return;
    target.dependsOnIds = t.dependsOn
      .map((d) => tasks[d]?.id)
      .filter((id): id is string => Boolean(id));
  });
  for (const task of tasks) {
    await wait(420);
    useCrewStore.getState().addTask(task);
  }

  // Dispatch en cascade : Atlas lance les paquets vers les agents libres.
  // En live, seules les tâches sans prérequis démarrent — les autres
  // attendent leurs livrables ; le moteur prend le relais.
  tasks.forEach((task, i) => {
    if (live && task.dependsOnIds?.length) return;
    window.setTimeout(
      () => useCrewStore.getState().dispatchTask(task.id),
      600 + i * 750,
    );
  });

  useCrewStore.getState().addChatMessage({
    role: "atlas",
    text: `Plan lancé : ${plan.tasks.length} tâches au board. L'équipe s'y met — suis la progression dans la scène ou le kanban.`,
  });
  useCrewStore.getState().pushToast({
    title: "Plan lancé ✦",
    message: `${project.name} · ${plan.tasks.length} tâches`,
    color,
  });
}

/** Abandon du plan proposé. */
export function cancelPlan(): void {
  const store = useCrewStore.getState();
  if (!store.pendingPlan) return;
  store.setPendingPlan(null);
  store.addChatMessage({
    role: "atlas",
    text: "Plan annulé. Reformule ton besoin quand tu veux, je proposerai autre chose.",
  });
}

/* -------------------------------------------------------------------------- */
/*  Simulation — fait vivre la scène : dispatch, progression, rotation.        */
/* -------------------------------------------------------------------------- */

const PROJECT_BETA = "proj_beta";
const PROJECT_SITE = "proj_site";

const DAY_MS = 24 * 60 * 60 * 1000;

function seedProjects(): Project[] {
  const now = Date.now();
  return [
    {
      id: PROJECT_BETA,
      name: "Lancement bêta CrewDesk",
      objective: "Ouvrir la bêta privée à 200 utilisateurs avec un produit stable et désirable.",
      color: "#5EE7FF",
      deadline: now + 12 * DAY_MS,
      createdAt: now,
    },
    {
      id: PROJECT_SITE,
      name: "Site vitrine & contenu",
      objective: "Publier le site marketing, le blog et la séquence d'emails de lancement.",
      color: "#A777FF",
      deadline: now + 21 * DAY_MS,
      createdAt: now,
    },
  ];
}

const SEED_BATCHES: ReadonlyArray<ReadonlyArray<Omit<Task, "id" | "status" | "progress" | "createdAt">>> = [
  [
    { title: "Maquette du dashboard analytics", description: "Vue d'ensemble avec graphiques temps réel et mode sombre.", agentId: "pixel", estimateMin: 18, tags: ["design", "ui"], projectId: PROJECT_BETA },
    { title: "API de synchronisation kanban", description: "Endpoints REST pour créer et déplacer les cartes.", agentId: "forge", estimateMin: 24, tags: ["dev", "api"], projectId: PROJECT_BETA },
    { title: "Analyse concurrentielle", description: "Benchmark des 5 outils de gestion d'agents IA du marché.", agentId: "sonar", estimateMin: 15, tags: ["recherche"], projectId: PROJECT_BETA },
    { title: "Page « Fonctionnalités » du site", description: "Rédaction orientée bénéfices, ton premium.", agentId: "plume", estimateMin: 12, tags: ["contenu"], projectId: PROJECT_SITE },
    { title: "Calendrier de lancement bêta", description: "Jalons, liste d'attente et séquence d'emails.", agentId: "vega", estimateMin: 14, tags: ["planning"], projectId: PROJECT_BETA },
    { title: "Icônes du design system", description: "Set de 24 icônes cohérentes, grille 24px.", agentId: "pixel", estimateMin: 16, tags: ["design"], projectId: PROJECT_SITE },
    { title: "Optimisation des requêtes", description: "Réduire le temps de réponse médian sous 80 ms.", agentId: "forge", estimateMin: 20, tags: ["dev", "perf"], projectId: PROJECT_BETA },
  ],
  [
    { title: "Sondage utilisateurs bêta", description: "Questionnaire de satisfaction et analyse des verbatims.", agentId: "sonar", estimateMin: 14, tags: ["recherche"], projectId: PROJECT_BETA },
    { title: "Newsletter de juin", description: "Annonce des nouveautés et étude de cas client.", agentId: "plume", estimateMin: 12, tags: ["contenu"], projectId: PROJECT_SITE },
    { title: "Animations d'onboarding", description: "Micro-interactions du premier lancement.", agentId: "pixel", estimateMin: 18, tags: ["design", "motion"], projectId: PROJECT_BETA },
    { title: "Tests end-to-end du kanban", description: "Couvrir le drag & drop et la synchronisation temps réel.", agentId: "forge", estimateMin: 22, tags: ["dev", "tests"], projectId: PROJECT_BETA },
    { title: "Plan réseaux sociaux S26", description: "Calendrier éditorial et visuels associés.", agentId: "vega", estimateMin: 12, tags: ["marketing"], projectId: PROJECT_SITE },
    { title: "Veille tarification SaaS", description: "Modèles de pricing des concurrents directs.", agentId: "sonar", estimateMin: 13, tags: ["recherche"], projectId: PROJECT_SITE },
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
/** Temps de relecture par Atlas avant validation. */
const REVIEW_MS = 4800;
/** Exécutions API simultanées maximum (coût + limites de débit). */
const MAX_PARALLEL_EXECUTIONS = 2;

/* ----------------------- Exécution réelle (mode live) --------------------- */

const inflight = new Set<string>();

/** Vrai si tous les livrables prérequis de la tâche sont disponibles. */
function depsMet(task: Task, tasks: Task[]): boolean {
  return (task.dependsOnIds ?? []).every((id) => {
    const dep = tasks.find((t) => t.id === id);
    return !dep || dep.status === "done";
  });
}

/** Enregistre la dépense globale et alerte au franchissement du budget. */
function registerSpend(usage: {
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}): void {
  const before = useCrewStore.getState();
  const wasOver =
    before.budgetUSD !== null && before.spend.costUSD >= before.budgetUSD;
  before.addSpend(usage);
  const after = useCrewStore.getState();
  if (
    after.budgetUSD !== null &&
    after.spend.costUSD >= after.budgetUSD &&
    !wasOver
  ) {
    after.pushToast({
      title: "Budget atteint",
      message: `${after.spend.costUSD.toFixed(2)} $ consommés sur ${after.budgetUSD.toFixed(2)} $.`,
      color: "#FF8A4C",
    });
  }
}

/** Projets ayant déjà une exécution en vol (1 agent par dossier à la fois). */
function busyProjects(): Set<string> {
  const s = useCrewStore.getState();
  const out = new Set<string>();
  for (const id of inflight) {
    const t = s.tasks.find((task) => task.id === id);
    if (t?.projectId) out.add(t.projectId);
  }
  return out;
}

/** Appelle l'agent (API) : il travaille dans le dossier du projet. */
async function executeTask(taskId: string): Promise<void> {
  const s = useCrewStore.getState();
  const task = s.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const def = AGENT_BY_ID[task.agentId];
  const project = task.projectId
    ? s.projects.find((p) => p.id === task.projectId)
    : undefined;
  if (!project?.dir) {
    useCrewStore
      .getState()
      .failTask(taskId, "Tâche sans dossier projet — relance-la via un plan d'Atlas.");
    return;
  }
  const context = (task.dependsOnIds ?? [])
    .map((id) => s.tasks.find((t) => t.id === id))
    .filter((dep): dep is Task => Boolean(dep?.deliverable))
    .map((dep) => ({
      title: dep.title,
      agent: AGENT_BY_ID[dep.agentId].name,
      deliverable: dep.deliverable ?? "",
    }));

  inflight.add(taskId);
  try {
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: { title: task.title, description: task.description, tags: task.tags },
        agent: { name: def.name, role: def.role, personality: def.personality },
        project: { name: project.name, objective: project.objective, dir: project.dir },
        context,
        skills: activeSkills(task.agentId),
        revision: task.revisionNote
          ? { note: task.revisionNote, previousReport: task.deliverable ?? "" }
          : undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      report?: string;
      files?: string[];
      error?: string;
      usage?: { inputTokens: number; outputTokens: number; costUSD: number };
    };
    if (data.usage) {
      registerSpend(data.usage);
      useCrewStore.getState().addTaskUsage(taskId, data.usage);
    }
    if (!res.ok || !data.report) {
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }
    const cur = useCrewStore.getState().tasks.find((t) => t.id === taskId);
    if (cur && cur.status === "in_progress") {
      useCrewStore.getState().sendToReview(taskId, data.report, data.files ?? []);
    }
  } catch (error) {
    const cur = useCrewStore.getState().tasks.find((t) => t.id === taskId);
    if (cur && cur.status === "in_progress") {
      useCrewStore
        .getState()
        .failTask(
          taskId,
          error instanceof Error ? error.message : "Erreur inconnue",
        );
    }
  } finally {
    inflight.delete(taskId);
  }
}

export function startSimulation(live: boolean): () => void {
  const store = useCrewStore;
  let lastDispatch = 0;
  let emptySince: number | null = null;
  let batchIndex = 0;

  // Seed de démonstration uniquement en simulation : en live, le backlog
  // se remplit via les plans validés avec Atlas — chaque tâche coûte des tokens.
  if (!live) {
    if (store.getState().projects.length === 0) {
      store.getState().seedProjects(seedProjects());
    }
    if (store.getState().tasks.length === 0) {
      const batch = SEED_BATCHES[0];
      if (batch) store.getState().seedTasks(batch.map(makeTask));
    }
  }

  const interval = window.setInterval(() => {
    const now = Date.now();
    const s = store.getState();

    // 1. Transitions de déplacement (arrivée au poste, à la machine à café,
    //    ou retour en zone pause) et fin de pause café.
    for (const rt of Object.values(s.agents)) {
      if (rt.pose && now >= rt.pose.startedAt + rt.pose.duration) {
        if (rt.status === "walking") {
          if (rt.taskId) s.beginWork(rt.id);
          else s.startBreak(rt.id);
        } else if (rt.status === "returning") {
          s.settleAgent(rt.id);
        }
      }
      if (rt.status === "break" && rt.breakUntil && now >= rt.breakUntil) {
        s.endBreak(rt.id);
      }
    }

    // 2. Travail en cours.
    //    Simulation : progression factice → revue à 100 %.
    //    Live : lancement de l'appel API (livrable réel), progression
    //    d'attente qui plafonne à 90 % jusqu'à la réponse.
    const fresh = store.getState();
    const budgetReached =
      live && fresh.budgetUSD !== null && fresh.spend.costUSD >= fresh.budgetUSD;
    for (const task of fresh.tasks) {
      if (task.status !== "in_progress") continue;
      const carrier = fresh.agents[task.agentId];
      if (carrier.taskId !== task.id || carrier.status !== "working") continue;

      if (live) {
        if (task.deliverable && !task.revisionNote) {
          // Livrable déjà présent (rechargement) : direct en revue.
          fresh.sendToReview(task.id);
        } else if (inflight.has(task.id)) {
          fresh.setTaskProgress(task.id, Math.min(task.progress + 0.9, 90));
        } else if (
          !budgetReached &&
          inflight.size < MAX_PARALLEL_EXECUTIONS &&
          (!task.projectId || !busyProjects().has(task.projectId))
        ) {
          // Un seul agent à la fois par dossier projet (pas de conflits de fichiers).
          fresh.log(
            "start",
            `${AGENT_BY_ID[task.agentId].name} produit « ${task.title} »…`,
            task.agentId,
          );
          void executeTask(task.id);
        }
        continue;
      }

      const totalMs = task.estimateMin * SIM_MS_PER_MIN;
      const delta = (TICK_MS / totalMs) * 100 * (0.7 + Math.random() * 0.6);
      const next = task.progress + delta;
      if (next >= 100) fresh.sendToReview(task.id);
      else fresh.setTaskProgress(task.id, next);
    }

    // 3. Revue : Atlas valide après relecture.
    for (const task of store.getState().tasks) {
      if (task.status === "review" && now >= (task.reviewAt ?? now) + REVIEW_MS) {
        store.getState().approveTask(task.id);
      }
    }

    // 4. Dispatch : Atlas pioche dans le backlog, et reprend les cartes
    //    « Assigné » en attente. En live : seulement les tâches issues d'un
    //    plan validé, dont les prérequis sont livrés, et pas plus de deux
    //    échecs (au-delà, réassignation manuelle requise).
    const cur = store.getState();
    // Plafond de budget (live) : au-delà, plus aucune nouvelle exécution API
    // n'est lancée — les tâches restent en file jusqu'à relèvement du budget.
    const overBudget =
      live && cur.budgetUSD !== null && cur.spend.costUSD >= cur.budgetUSD;
    if (!overBudget && now - lastDispatch >= DISPATCH_COOLDOWN_MS) {
      const next = cur.tasks.find((t) => {
        if (t.status !== "backlog" && t.status !== "assigned") return false;
        const rt = cur.agents[t.agentId];
        if (rt.status !== "idle" || rt.taskId) return false;
        if (!live) return true;
        if (!depsMet(t, cur.tasks)) return false;
        if (t.status === "assigned") return true;
        return t.source === "live" && (t.attempts ?? 0) < 2;
      });
      if (next) {
        cur.dispatchTask(next.id);
        lastDispatch = now;
      }
    }

    // 5. Ambiance : pauses café spontanées des agents désœuvrés, et
    //    pression de file pour Atlas (il fait les cent pas au-delà de 4).
    const amb = store.getState();
    const waiting = amb.tasks.filter(
      (t) => t.status === "backlog" || t.status === "assigned",
    );
    amb.setQueuePressure(waiting.length > 4);
    const onBreak = Object.values(amb.agents).filter(
      (a) => a.status === "break" || (a.status === "walking" && !a.taskId),
    ).length;
    if (onBreak < 2 && Math.random() < 0.012) {
      const candidate = Object.values(amb.agents).find(
        (a) =>
          a.status === "idle" &&
          !AGENT_BY_ID[a.id].isOrchestrator &&
          !waiting.some((t) => t.agentId === a.id),
      );
      if (candidate) amb.sendToBreak(candidate.id);
    }

    // 6. Tout est terminé (simulation) : nouvelle vague après une pause.
    if (!live) {
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
    }
  }, TICK_MS);

  return () => window.clearInterval(interval);
}

/** Détecte le mode (clé API présente ?) puis démarre le moteur. */
export function useSimulation(): void {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      let live = false;
      let workspace: string | null = null;
      try {
        const res = await fetch("/api/health");
        const data = (await res.json()) as { live?: boolean; workspace?: string };
        live = Boolean(data.live);
        workspace = data.workspace ?? null;
      } catch {
        live = false;
      }
      if (cancelled) return;
      useCrewStore.getState().setLiveMode(live);
      useCrewStore.getState().setWorkspaceBase(workspace);
      cleanup = startSimulation(live);
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
