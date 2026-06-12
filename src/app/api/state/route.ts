import { NextResponse } from "next/server";
import { stateStore } from "@/services/server/store";
import { supabaseConfigured, userFromRequest } from "@/services/server/supabase";

export const maxDuration = 30;

/** Scope du store fichier (mono-utilisateur, mode local sans Supabase). */
const FILE_SCOPE = "default";
const MAX_BODY = 4_000_000; // ~4 Mo de garde-fou

export async function GET(request: Request) {
  if (supabaseConfigured()) {
    const user = await userFromRequest(request);
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const { data, error } = await user.client
      .from("crewdesk_state")
      .select("data, saved_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({
      state: data ? { savedAt: data.saved_at as number, data: data.data } : null,
    });
  }
  const state = await stateStore().load(FILE_SCOPE);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  let body: { savedAt?: number; data?: unknown };
  const text = await request.text();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: "État trop volumineux." }, { status: 413 });
  }
  try {
    body = JSON.parse(text) as { savedAt?: number; data?: unknown };
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (typeof body.savedAt !== "number" || body.data === undefined) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  if (supabaseConfigured()) {
    const user = await userFromRequest(request);
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const { error } = await user.client.from("crewdesk_state").upsert(
      {
        user_id: user.id,
        data: body.data,
        saved_at: body.savedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  await stateStore().save(FILE_SCOPE, { savedAt: body.savedAt, data: body.data });
  return NextResponse.json({ ok: true });
}
