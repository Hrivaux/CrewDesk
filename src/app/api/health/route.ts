import { NextResponse } from "next/server";

/** Le mode live est actif quand la clé API Anthropic est configurée côté serveur. */
export function GET() {
  return NextResponse.json({ live: Boolean(process.env.ANTHROPIC_API_KEY) });
}
