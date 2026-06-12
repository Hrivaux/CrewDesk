"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabaseBrowser";
import { hydratePersisted, persistedSlice, useCrewStore } from "@/stores/useCrewStore";

const SAVED_AT_KEY = "crewdesk-savedAt";
const DEBOUNCE_MS = 1500;
/** Délai maximum avant sauvegarde, même si le store change en continu. */
const MAX_WAIT_MS = 8000;

/**
 * Clé de comparaison ignorant les champs volatils tick-par-tick (progression,
 * horodatages de runtime) : la progression des tâches en cours n'est de toute
 * façon pas restaurée au rechargement. Évite d'écrire toutes les 1,5 s pendant
 * que l'équipe travaille — on ne sauvegarde que les changements significatifs.
 */
function syncKey(slice: ReturnType<typeof persistedSlice>): string {
  const stable = {
    ...slice,
    tasks: (slice.tasks ?? []).map((t) => ({
      ...t,
      progress: undefined,
      startedAt: undefined,
    })),
  };
  return JSON.stringify(stable);
}

/**
 * Persistance durable côté serveur (Supabase si configuré — isolé par
 * utilisateur via son JWT —, sinon fichier local). Au démarrage : applique
 * l'état distant s'il est plus récent que le cache ; ensuite, pousse les
 * changements en anti-rebond. localStorage = cache instantané + repli.
 */
export function StateSync() {
  useEffect(() => {
    const supabase = supabaseBrowser();
    const usesAuth = isSupabaseConfigured();
    let cancelled = false;
    let debTimer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;
    let lastPushed = "";
    let unsubStore: (() => void) | undefined;
    let started = false;

    function clearTimers() {
      if (debTimer) clearTimeout(debTimer);
      if (maxTimer) clearTimeout(maxTimer);
      debTimer = undefined;
      maxTimer = undefined;
    }

    function flush() {
      clearTimers();
      void push();
    }

    function scheduleFlush() {
      if (debTimer) clearTimeout(debTimer);
      debTimer = setTimeout(flush, DEBOUNCE_MS);
      maxTimer ??= setTimeout(flush, MAX_WAIT_MS);
    }

    async function authHeader(): Promise<Record<string, string>> {
      if (!supabase) return {};
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async function push() {
      const slice = persistedSlice(useCrewStore.getState());
      const key = syncKey(slice);
      if (key === lastPushed) return;
      lastPushed = key;
      const savedAt = Date.now();
      try {
        const res = await fetch("/api/state", {
          method: "PUT",
          headers: { "content-type": "application/json", ...(await authHeader()) },
          body: JSON.stringify({ savedAt, data: slice }),
        });
        if (res.ok) localStorage.setItem(SAVED_AT_KEY, String(savedAt));
      } catch {
        /* hors-ligne : le localStorage garde la copie */
      }
    }

    async function start() {
      if (started || cancelled) return;
      started = true;
      const localSavedAt = Number(localStorage.getItem(SAVED_AT_KEY) ?? 0);
      try {
        const res = await fetch("/api/state", { headers: await authHeader() });
        if (res.ok) {
          const { state } = (await res.json()) as {
            state: { savedAt: number; data: unknown } | null;
          };
          if (!cancelled && state && state.savedAt > localSavedAt) {
            hydratePersisted(state.data);
            localStorage.setItem(SAVED_AT_KEY, String(state.savedAt));
          }
        }
      } catch {
        /* pas de serveur d'état : on reste sur le localStorage */
      }
      if (cancelled) return;
      lastPushed = syncKey(persistedSlice(useCrewStore.getState()));
      unsubStore = useCrewStore.subscribe(scheduleFlush);
    }

    if (usesAuth && supabase) {
      // Attendre une session avant de synchroniser (état par utilisateur).
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) void start();
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session) void start();
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
        unsubStore?.();
        clearTimers();
      };
    }

    void start();
    return () => {
      cancelled = true;
      unsubStore?.();
      clearTimers();
    };
  }, []);

  return null;
}
