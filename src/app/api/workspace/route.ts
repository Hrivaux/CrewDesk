import { NextResponse } from "next/server";
import {
  setWorkspaceBase,
  workspaceBase,
  workspaceLocked,
} from "@/services/server/workspace";
import { supabaseConfigured } from "@/services/server/supabase";

/** Lecture du dossier de travail courant + s'il est modifiable. */
export function GET() {
  return NextResponse.json({
    base: workspaceBase(),
    // Modifiable seulement en local mono-utilisateur, sans verrou d'env.
    editable: !workspaceLocked() && !supabaseConfigured(),
    locked: workspaceLocked(),
  });
}

/** Définit le dossier de travail (local uniquement). */
export async function PUT(request: Request) {
  if (supabaseConfigured()) {
    return NextResponse.json(
      { error: "Le dossier est fixé par le serveur en mode multi-utilisateur." },
      { status: 403 },
    );
  }
  if (workspaceLocked()) {
    return NextResponse.json(
      { error: "Dossier verrouillé par la variable d'environnement CREWDESK_WORKSPACE." },
      { status: 409 },
    );
  }
  let dir: string;
  try {
    const body = (await request.json()) as { dir?: string };
    dir = String(body.dir ?? "");
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  try {
    setWorkspaceBase(dir);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chemin invalide." },
      { status: 400 },
    );
  }
  return NextResponse.json({ base: workspaceBase() });
}
