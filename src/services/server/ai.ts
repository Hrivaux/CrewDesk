import type { TaskUsage } from "@/services/types";

export type AIProvider = "anthropic" | "openai";

export interface AIConfig {
  provider: AIProvider | null;
  model: string | null;
}

const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-8";
const DEFAULT_OPENAI_MODEL = "gpt-5.5";

export function resolveAIConfig(): AIConfig {
  const requested = (process.env.CREWDESK_AI_PROVIDER ?? "auto").toLowerCase();
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if ((requested === "openai" || requested === "gpt") && hasOpenAI) {
    return {
      provider: "openai",
      model: process.env.CREWDESK_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
    };
  }

  if ((requested === "anthropic" || requested === "claude") && hasAnthropic) {
    return {
      provider: "anthropic",
      model:
        process.env.CREWDESK_MODEL ??
        process.env.ANTHROPIC_MODEL ??
        DEFAULT_ANTHROPIC_MODEL,
    };
  }

  if (requested === "auto") {
    if (hasAnthropic) {
      return {
        provider: "anthropic",
        model:
          process.env.CREWDESK_MODEL ??
          process.env.ANTHROPIC_MODEL ??
          DEFAULT_ANTHROPIC_MODEL,
      };
    }
    if (hasOpenAI) {
      return {
        provider: "openai",
        model: process.env.CREWDESK_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
      };
    }
  }

  return { provider: null, model: null };
}

export interface OpenAITool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface OpenAIResponseItem {
  id?: string;
  type: string;
  role?: string;
  content?: Array<{ type: string; text?: string }>;
  name?: string;
  call_id?: string;
  arguments?: string;
}

export interface OpenAIResponse {
  output?: OpenAIResponseItem[];
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: { message?: string };
}

export async function createOpenAIResponse(body: Record<string, unknown>): Promise<OpenAIResponse> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as OpenAIResponse;
  if (!res.ok) {
    throw new Error(data.error?.message ?? `OpenAI API HTTP ${res.status}`);
  }
  return data;
}

export function extractOpenAIText(response: OpenAIResponse): string {
  if (response.output_text?.trim()) return response.output_text.trim();
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((part) => part.type === "output_text" || part.type === "text")
      .map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

export function openAIFunctionCalls(response: OpenAIResponse): Array<{
  name: string;
  callId: string;
  arguments: Record<string, unknown>;
  raw: OpenAIResponseItem;
}> {
  return (response.output ?? [])
    .filter((item) => item.type === "function_call" && item.name && item.call_id)
    .map((item) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(item.arguments ?? "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return {
        name: item.name ?? "",
        callId: item.call_id ?? "",
        arguments: args,
        raw: item,
      };
    });
}

export function openAIToolFromAnthropicTool(tool: {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}): OpenAITool {
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  };
}

export function usageFromOpenAI(response: OpenAIResponse): TaskUsage {
  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const inputPrice = Number(process.env.OPENAI_INPUT_USD_PER_MTOK ?? 0);
  const outputPrice = Number(process.env.OPENAI_OUTPUT_USD_PER_MTOK ?? 0);
  const costUSD =
    (inputTokens / 1_000_000) * (Number.isFinite(inputPrice) ? inputPrice : 0) +
    (outputTokens / 1_000_000) * (Number.isFinite(outputPrice) ? outputPrice : 0);
  return {
    inputTokens,
    outputTokens,
    costUSD: Math.round(costUSD * 10_000) / 10_000,
  };
}
