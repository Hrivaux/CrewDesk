import { NextResponse } from "next/server";
import { commandsAllowed, workspaceBase } from "@/services/server/workspace";
import { supabaseConfigured } from "@/services/server/supabase";

/** Le mode live est actif quand la clé API Anthropic est configurée côté serveur. */
export function GET() {
  return NextResponse.json({
    live: Boolean(process.env.ANTHROPIC_API_KEY),
    workspace: workspaceBase(),
    commands: commandsAllowed(),
    auth: supabaseConfigured(),
  });
}
