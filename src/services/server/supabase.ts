import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Accès serveur à Supabase. Le chemin de données utilise le JWT de
 * l'utilisateur : la sécurité au niveau ligne (RLS) impose l'isolation,
 * sans que le code ait à filtrer par utilisateur.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(url && anon);
}

export interface RequestUser {
  id: string;
  email: string | null;
  /** Client Supabase agissant en tant que cet utilisateur (RLS appliquée). */
  client: SupabaseClient;
}

/** Authentifie la requête via le Bearer token ; null si absent/invalide. */
export async function userFromRequest(request: Request): Promise<RequestUser | null> {
  if (!supabaseConfigured()) return null;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const client = createClient(url as string, anon as string, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, client };
}
