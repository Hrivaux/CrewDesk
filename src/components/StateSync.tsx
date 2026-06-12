"use client";

import { useEffect } from "react";
import { hydratePersisted, persistedSlice, useCrewStore } from "@/stores/useCrewStore";

const SAVED_AT_KEY = "crewdesk-savedAt";
const DEBOUNCE_MS = 1500;

/**
 * Persistance serveur durable : au montage, récupère l'état du serveur et
 * l'applique s'il est plus récent que le cache local ; ensuite, pousse les
 * changements (anti-rebond). Le localStorage reste un cache de chargement
 * instantané et un repli hors-ligne. Dégrade silencieusement si le serveur
 * est injoignable.
 */
export function StateSync() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastPushed = "";
    let cleanup: (() => void) | undefined;

    const localSavedAt = Number(localStorage.getItem(SAVED_AT_KEY) ?? 0);

    const push = () => {
      const slice = persistedSlice(useCrewStore.getState());
      const serialized = JSON.stringify(slice);
      if (serialized === lastPushed) return;
      lastPushed = serialized;
      const savedAt = Date.now();
      void fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ savedAt, data: slice }),
      })
        .then((res) => {
          if (res.ok) localStorage.setItem(SAVED_AT_KEY, String(savedAt));
        })
        .catch(() => {});
    };

    void (async () => {
      try {
        const res = await fetch("/api/state");
        const { state } = (await res.json()) as {
          state: { savedAt: number; data: unknown } | null;
        };
        if (!cancelled && state && state.savedAt > localSavedAt) {
          hydratePersisted(state.data);
          localStorage.setItem(SAVED_AT_KEY, String(state.savedAt));
          lastPushed = JSON.stringify(persistedSlice(useCrewStore.getState()));
        }
      } catch {
        // Pas de serveur d'état : on reste sur le localStorage.
      }

      if (cancelled) return;
      // Pousse les changements ultérieurs, anti-rebondi.
      const unsub = useCrewStore.subscribe(() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(push, DEBOUNCE_MS);
      });
      cleanup = () => {
        unsub();
        if (timer) clearTimeout(timer);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
