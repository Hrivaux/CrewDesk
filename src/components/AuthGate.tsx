"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/Button";

type Mode = "signin" | "signup";

function LoginScreen() {
  const supabase = supabaseBrowser();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(
    null,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMessage({
            kind: "info",
            text: "Compte créé. Vérifie tes emails pour confirmer, puis connecte-toi.",
          });
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Échec de l'authentification.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="glass w-full max-w-sm rounded-2xl p-7">
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
            <path d="M16 7 27 13.5 16 20 5 13.5Z" fill="#10161F" stroke="#5EE7FF" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M5 13.5V18L16 24.5 27 18V13.5L16 20Z" fill="#0B1119" stroke="#5EE7FF" strokeWidth="1.1" strokeLinejoin="round" opacity="0.7" />
            <circle cx="16" cy="13.5" r="2.4" fill="#5EE7FF" />
          </svg>
          <div>
            <h1 className="font-display text-base font-bold tracking-wide">CrewDesk</h1>
            <p className="label-mono mt-0.5">
              {mode === "signin" ? "Connexion" : "Créer un compte"}
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="label-mono">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="mt-3 block">
          <span className="label-mono">Mot de passe</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="focus-ring mt-1 w-full rounded-lg border border-[rgba(234,240,248,0.12)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-sm text-foreground"
          />
        </label>

        {message ? (
          <p
            className="mt-3 text-[11px] leading-relaxed"
            style={{ color: message.kind === "error" ? "#FF8A4C" : "#5EE7FF" }}
          >
            {message.text}
          </p>
        ) : null}

        <Button variant="primary" className="mt-5 w-full justify-center" disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="focus-ring mt-3 w-full text-center text-[11px] text-muted transition-colors hover:text-foreground"
        >
          {mode === "signin"
            ? "Pas de compte ? Créer un compte"
            : "Déjà un compte ? Se connecter"}
        </button>
      </form>
    </div>
  );
}

/** Protège l'app derrière une connexion quand Supabase est configuré. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Mode local (pas de Supabase) : aucune connexion requise.
  if (!isSupabaseConfigured()) return <>{children}</>;

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center">
        <span className="label-mono">Chargement…</span>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <>{children}</>;
}
