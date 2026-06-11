import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { agentSystem } from "@/services/prompts";

export const maxDuration = 300;

const MODEL = process.env.CREWDESK_MODEL ?? "claude-opus-4-8";
/** Chaque livrable prérequis est tronqué avant injection en contexte. */
const CONTEXT_CHARS = 12_000;

interface ExecutePayload {
  task: { title: string; description: string; tags?: string[] };
  agent: { name: string; role: string; personality: string };
  project?: { name: string; objective: string };
  context?: Array<{ title: string; agent: string; deliverable: string }>;
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
    if (!payload?.task?.title || !payload?.task?.description || !payload?.agent?.name) {
      throw new Error("invalid");
    }
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const sections: string[] = [];
  if (payload.project) {
    sections.push(
      `# Projet : ${payload.project.name}\nObjectif : ${payload.project.objective}`,
    );
  }
  for (const dep of payload.context ?? []) {
    sections.push(
      `# Livrable prérequis — « ${dep.title} » (par ${dep.agent})\n\n${dep.deliverable.slice(0, CONTEXT_CHARS)}`,
    );
  }
  sections.push(
    `# Ta tâche : ${payload.task.title}\n\n${payload.task.description}` +
      (payload.task.tags?.length ? `\n\nTags : ${payload.task.tags.join(", ")}` : ""),
  );

  const client = new Anthropic();
  try {
    // Livrables potentiellement longs (code, contenus) : streaming côté serveur
    // pour éviter les timeouts HTTP, réponse agrégée côté client.
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32_000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: agentSystem(payload.agent),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: sections.join("\n\n---\n\n") }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "La tâche a été refusée par les garde-fous du modèle." },
        { status: 422 },
      );
    }

    const deliverable = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable vide." }, { status: 502 });
    }
    return NextResponse.json({
      deliverable,
      truncated: message.stop_reason === "max_tokens",
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
