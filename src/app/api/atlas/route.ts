import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { AgentId, PlannedTask } from "@/services/types";
import { ATLAS_SYSTEM, PLAN_TOOL } from "@/services/prompts";

export const maxDuration = 300;

const MODEL = process.env.CREWDESK_MODEL ?? "claude-opus-4-8";
/** Fenêtre de conversation envoyée au modèle. */
const HISTORY_LIMIT = 24;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface PlanToolInput {
  project_name: string;
  summary: string;
  tasks: Array<{
    title: string;
    description: string;
    agent: AgentId;
    estimate_min: number;
    tags: string[];
    depends_on?: number[];
  }>;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante côté serveur." },
      { status: 503 },
    );
  }

  let turns: ChatTurn[];
  try {
    const body = (await request.json()) as { messages?: ChatTurn[] };
    turns = (body.messages ?? []).filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== "",
    );
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  if (turns.length === 0 || turns[turns.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "La conversation doit se terminer par un message utilisateur." },
      { status: 400 },
    );
  }

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = turns
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));
  // La conversation doit commencer par un tour utilisateur.
  while (messages.length > 0 && messages[0]?.role !== "user") messages.shift();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: ATLAS_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [PLAN_TOOL],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        type: "text",
        text: "Je ne peux pas traiter cette demande. Reformule ton besoin et je proposerai un plan.",
      });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === PLAN_TOOL.name,
    );

    if (toolUse) {
      const input = toolUse.input as PlanToolInput;
      const tasks: PlannedTask[] = (input.tasks ?? []).map((t) => ({
        title: t.title,
        description: t.description,
        agentId: t.agent,
        estimateMin: Math.max(1, Math.round(t.estimate_min)),
        tags: (t.tags ?? []).slice(0, 3),
        dependsOn: t.depends_on,
      }));
      return NextResponse.json({
        type: "plan",
        text,
        plan: {
          id: `plan_${Date.now().toString(36)}`,
          request: turns[turns.length - 1]?.content ?? "",
          summary: input.summary,
          projectName: input.project_name,
          tasks,
        },
      });
    }

    return NextResponse.json({
      type: "text",
      text: text || "Peux-tu préciser ton besoin ?",
    });
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
