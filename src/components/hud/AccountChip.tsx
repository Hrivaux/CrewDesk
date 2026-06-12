"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabaseBrowser";

/** Email connecté + déconnexion. Visible seulement en mode Supabase. */
export function AccountChip() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured() || !email) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden font-mono text-[10px] text-muted sm:inline" title={email}>
        {email.length > 22 ? `${email.slice(0, 20)}…` : email}
      </span>
      <button
        type="button"
        onClick={() => void supabaseBrowser()?.auth.signOut()}
        className="focus-ring rounded-lg border border-[rgba(234,240,248,0.12)] px-2 py-1 font-display text-[11px] font-semibold text-muted transition-colors hover:text-foreground"
      >
        Déconnexion
      </button>
    </div>
  );
}
