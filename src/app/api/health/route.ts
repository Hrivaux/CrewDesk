import { NextResponse } from "next/server";
import { resolveAIConfig } from "@/services/server/ai";
import { commandsAllowed, workspaceBase } from "@/services/server/workspace";
import { supabaseConfigured } from "@/services/server/supabase";

/** Le mode live est actif quand au moins une clé provider est configurée côté serveur. */
export function GET() {
  const ai = resolveAIConfig();
  return NextResponse.json({
    live: Boolean(ai.provider),
    provider: ai.provider,
    model: ai.model,
    workspace: workspaceBase(),
    commands: commandsAllowed(),
    auth: supabaseConfigured(),
  });
}
