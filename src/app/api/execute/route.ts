import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { agentSystem, skillsSection, type SkillPayload } from "@/services/prompts";
import { addMessageUsage, emptyUsage, priceUsage } from "@/services/server/pricing";
import {
  EXECUTOR_TOOLS,
  WEB_TOOLS,
  projectDir,
  runTool,
  webToolsEnabled,
} from "@/services/server/workspace";

export const maxDuration = 300;

const MODEL = process.env.CREWDESK_MODEL ?? "claude-opus-4-8";
/** Chaque rapport prérequis est tronqué avant injection en contexte. */
const CONTEXT_CHARS = 8_000;
/** Garde-fou de la boucle agentique. */
const MAX_ITERATIONS = 40;

interface ExecutePayload {
  task: { title: string; description: string; tags?: string[] };
  agent: { name: string; role: string; personality: string };
  project: { name: string; objective: string; dir: string };
  context?: Array<{ title: string; agent: string; deliverable: string }>;
  /** Entraînement de l'agent (skills & connaissances actifs). */
  skills?: SkillPayload[];
  /** Retouche : retour utilisateur + rapport précédent de l'agent. */
  revision?: { note: string; previousReport: string };
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante côté serveur." },
      { status: 503 },
    );
  }

  let payload: ExecutePayload;
  try {
    payload = (await request.json()) as ExecutePayload;
    if (
      !payload?.task?.title ||
      !payload?.task?.description ||
      !payload?.agent?.name ||
      !payload?.project?.dir
    ) {
      throw new Error("invalid");
    }
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  let root: string;
  try {
    root = await projectDir(payload.project.dir);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dossier projet invalide." },
      { status: 400 },
    );
  }

  // Brief de mission : projet, rapports des prérequis, tâche.
  const sections: string[] = [
    `# Projet : ${payload.project.name}\nObjectif : ${payload.project.objective}\nDossier de travail : la racine du projet (chemins relatifs).`,
  ];
  for (const dep of payload.context ?? []) {
    sections.push(
      `# Rapport de la tâche prérequise « ${dep.title} » (par ${dep.agent})\n\n${dep.deliverable.slice(0, CONTEXT_CHARS)}`,
    );
  }
  sections.push(
    `# Ta tâche : ${payload.task.title}\n\n${payload.task.description}` +
      (payload.task.tags?.length ? `\n\nTags : ${payload.task.tags.join(", ")}` : ""),
  );
  if (payload.revision) {
    sections.push(
      `# RETOUCHE DEMANDÉE\n\nTu as déjà réalisé cette tâche. Ton rapport précédent :\n\n${payload.revision.previousReport.slice(0, CONTEXT_CHARS)}\n\nRetour de l'utilisateur :\n\n${payload.revision.note.slice(0, 4000)}\n\nRelis les fichiers existants puis modifie-les pour répondre à ce retour — ne repars pas de zéro, conserve ce qui n'est pas concerné.`,
    );
  }

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: sections.join("\n\n---\n\n") },
  ];
  const filesWritten = new Set<string>();
  const tools = webToolsEnabled() ? [...EXECUTOR_TOOLS, ...WEB_TOOLS] : EXECUTOR_TOOLS;
  const usage = emptyUsage();

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16_000,
        thinking: { type: "adaptive" },
        system: [
          {
            type: "text",
            text: agentSystem(payload.agent) + skillsSection(payload.skills ?? []),
            cache_control: { type: "ephemeral" },
          },
        ],
        tools,
        messages,
      });
      const response = await stream.finalMessage();
      addMessageUsage(usage, response);

      if (response.stop_reason === "refusal") {
        return NextResponse.json(
          { error: "La tâche a été refusée par les garde-fous du modèle." },
          { status: 422 },
        );
      }

      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
        // Terminé : le texte final est le rapport de l'agent.
        const report = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({
          report: report || "Tâche terminée.",
          files: [...filesWritten].sort(),
          usage: priceUsage(usage, MODEL),
        });
      }

      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        const outcome = await runTool(
          root,
          toolUse.name,
          (toolUse.input ?? {}) as Record<string, unknown>,
        );
        if (outcome.wroteFile) filesWritten.add(outcome.wroteFile);
        results.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: outcome.result,
          is_error: outcome.isError ?? false,
        });
      }
      messages.push({ role: "user", content: results });
    }

    return NextResponse.json(
      {
        error: `Tâche interrompue après ${MAX_ITERATIONS} itérations.`,
        files: [...filesWritten].sort(),
      },
      { status: 504 },
    );
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API Anthropic (${error.status ?? "?"}) : ${error.message}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "Erreur inattendue côté serveur." }, { status: 500 });
  }
}
