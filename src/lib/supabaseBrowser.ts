"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Vrai si l'auth/DB Supabase est configurée (sinon : mode fichier local). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}

let client: SupabaseClient | null = null;

/** Client navigateur (clé anon, session persistée). Null si non configuré. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(url as string, anon as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "crewdesk-auth",
    },
  });
  return client;
}
