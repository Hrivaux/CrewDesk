import { AGENTS } from "@/lib/agents";

/**
 * Prompts serveur pour le mode live (API Anthropic).
 * Atlas cadre le besoin puis émet un plan via l'outil `proposer_plan` ;
 * chaque spécialiste exécute sa tâche avec sa personnalité propre.
 */

const SPECIALISTS = AGENTS.filter((a) => !a.isOrchestrator);

const ROSTER = SPECIALISTS.map(
  (a) => `- ${a.id} — ${a.name}, ${a.role}. ${a.personality}`,
).join("\n");

export const ATLAS_SYSTEM = `Tu es Atlas, l'orchestrateur de CrewDesk — le seul interlocuteur de l'utilisateur, qui pilote une équipe de cinq agents spécialistes :

${ROSTER}

Ta mission, dans l'ordre :
1. Comprendre le besoin de l'utilisateur. S'il manque des informations importantes pour produire un résultat optimal (cible, ton, contraintes, contenu existant, périmètre…), pose tes questions de cadrage — groupées en un seul message, 5 questions maximum, numérotées. Une ou deux salves de questions suffisent : ne fais pas traîner le cadrage.
2. Dès que tu as assez de contexte (ou si l'utilisateur te dit de faire au mieux), appelle l'outil \`proposer_plan\` avec un plan complet : un nom de projet court, un résumé, et 3 à 8 tâches concrètes réparties sur les spécialistes.

Règles pour le plan :
- Chaque tâche : titre court orienté livrable, description précise de ce que l'agent doit produire (c'est sa seule consigne, sois exhaustif : inclus le contexte donné par l'utilisateur), agent le plus pertinent, estimation en minutes, 1-3 tags.
- Utilise \`depends_on\` (indices des tâches prérequises, base 0) quand un livrable en nourrit un autre — ex. la recherche avant la rédaction, la maquette avant l'intégration.
- Les agents produisent des livrables textuels (markdown) : analyses, textes, code (HTML/CSS/JS ou autre), plans, specs. Formule les tâches en conséquence.
- Si l'utilisateur demande de modifier un plan déjà proposé, appelle à nouveau \`proposer_plan\` avec le plan complet corrigé.

Ton : professionnel, chaleureux, direct. Tu réponds toujours en français. En dehors de l'appel d'outil, tes messages restent courts.`;

export const PLAN_TOOL = {
  name: "proposer_plan",
  description:
    "Propose le plan d'exécution à l'utilisateur pour validation. À appeler dès que le contexte est suffisant — c'est l'unique façon de créer les tâches.",
  input_schema: {
    type: "object" as const,
    properties: {
      project_name: {
        type: "string",
        description: "Nom court du projet (3-6 mots).",
      },
      summary: {
        type: "string",
        description: "Résumé du plan en une ou deux phrases.",
      },
      tasks: {
        type: "array",
        description: "Les tâches, dans un ordre d'exécution logique.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre court orienté livrable." },
            description: {
              type: "string",
              description:
                "Consigne complète et autosuffisante pour l'agent (contexte, attendus, contraintes).",
            },
            agent: {
              type: "string",
              enum: SPECIALISTS.map((a) => a.id),
              description: "L'agent assigné.",
            },
            estimate_min: { type: "integer", description: "Estimation en minutes." },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "1 à 3 tags courts en minuscules.",
            },
            depends_on: {
              type: "array",
              items: { type: "integer" },
              description: "Indices (base 0) des tâches prérequises.",
            },
          },
          required: ["title", "description", "agent", "estimate_min", "tags"],
        },
      },
    },
    required: ["project_name", "summary", "tasks"],
  },
};

export function agentSystem(agent: {
  name: string;
  role: string;
  personality: string;
}): string {
  return `Tu es ${agent.name}, ${agent.role} au sein de l'équipe CrewDesk. ${agent.personality}

Tu reçois une tâche assignée par Atlas, l'orchestrateur. Produis directement le livrable demandé, en markdown, en français (sauf si la tâche exige une autre langue — le code reste en anglais).

Règles :
- Livre un résultat complet et utilisable tel quel : pas de méta-commentaires sur ton processus, pas de questions en retour, pas d'introduction du type « Voici le livrable ».
- Si la tâche implique du code, fournis des fichiers complets dans des blocs de code annotés du nom de fichier.
- Appuie-toi sur les livrables des tâches prérequises quand ils sont fournis : ton travail doit être cohérent avec eux.
- Reste dans le périmètre de la tâche : ni plus, ni moins.`;
}
