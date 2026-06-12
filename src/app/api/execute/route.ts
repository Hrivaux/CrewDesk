import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { agentSystem, skillsSection, type SkillPayload } from "@/services/prompts";
import type { TaskUsage } from "@/services/types";
import {
  createOpenAIResponse,
  extractOpenAIText,
  openAIFunctionCalls,
  openAIToolFromAnthropicTool,
  type OpenAIResponseItem,
  resolveAIConfig,
  usageFromOpenAI,
} from "@/services/server/ai";
import { addMessageUsage, emptyUsage, priceUsage } from "@/services/server/pricing";
import {
  EXECUTOR_TOOLS,
  WEB_TOOLS,
  projectDir,
  runTool,
  webToolsEnabled,
} from "@/services/server/workspace";

export const maxDuration = 300;

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
  const ai = resolveAIConfig();
  if (!ai.provider || !ai.model) {
    return NextResponse.json(
      { error: "Clé API manquante côté serveur (ANTHROPIC_API_KEY ou OPENAI_API_KEY)." },
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

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: sections.join("\n\n---\n\n") },
  ];
  const filesWritten = new Set<string>();
  const usage = emptyUsage();

  try {
    if (ai.provider === "openai") {
      const openAIInput: Array<Record<string, unknown> | OpenAIResponseItem> = [
        { role: "user", content: sections.join("\n\n---\n\n") },
      ];
      const openAITools = EXECUTOR_TOOLS.map(openAIToolFromAnthropicTool);
      const openAIUsage: TaskUsage = { inputTokens: 0, outputTokens: 0, costUSD: 0 };

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await createOpenAIResponse({
          model: ai.model,
          instructions: agentSystem(payload.agent) + skillsSection(payload.skills ?? []),
          input: openAIInput,
          tools: openAITools,
          tool_choice: "auto",
          reasoning: { effort: "medium" },
          max_output_tokens: 16_000,
        });
        const turnUsage = usageFromOpenAI(response);
        openAIUsage.inputTokens += turnUsage.inputTokens;
        openAIUsage.outputTokens += turnUsage.outputTokens;
        openAIUsage.costUSD += turnUsage.costUSD;

        const toolUses = openAIFunctionCalls(response);
        if (toolUses.length === 0) {
          return NextResponse.json({
            report: extractOpenAIText(response) || "Tâche terminée.",
            files: [...filesWritten].sort(),
            usage: {
              ...openAIUsage,
              costUSD: Math.round(openAIUsage.costUSD * 10_000) / 10_000,
            },
          });
        }

        openAIInput.push(...(response.output ?? []));
        for (const toolUse of toolUses) {
          const outcome = await runTool(root, toolUse.name, toolUse.arguments);
          if (outcome.wroteFile) filesWritten.add(outcome.wroteFile);
          openAIInput.push({
            type: "function_call_output",
            call_id: toolUse.callId,
            output: outcome.result,
          });
        }
      }

      return NextResponse.json(
        {
          error: `Tâche interrompue après ${MAX_ITERATIONS} itérations.`,
          files: [...filesWritten].sort(),
        },
        { status: 504 },
      );
    }

    const client = new Anthropic();
    const tools = webToolsEnabled() ? [...EXECUTOR_TOOLS, ...WEB_TOOLS] : EXECUTOR_TOOLS;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = client.messages.stream({
        model: ai.model,
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
          usage: priceUsage(usage, ai.model),
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
