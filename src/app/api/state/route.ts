import { NextResponse } from "next/server";
import { stateStore } from "@/services/server/store";

export const maxDuration = 30;

/** Scope mono-utilisateur en v1 ; deviendra l'id utilisateur le jour J (auth). */
const SCOPE = "default";

const MAX_BODY = 4_000_000; // ~4 Mo de garde-fou

export async function GET() {
  const state = await stateStore().load(SCOPE);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  let body: { savedAt?: number; data?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: "État trop volumineux." }, { status: 413 });
    }
    body = JSON.parse(text) as { savedAt?: number; data?: unknown };
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (typeof body.savedAt !== "number" || body.data === undefined) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }
  await stateStore().save(SCOPE, { savedAt: body.savedAt, data: body.data });
  return NextResponse.json({ ok: true });
}
