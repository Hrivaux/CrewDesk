"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Capture les erreurs de rendu pour éviter l'écran blanc : affiche un repli
 * lisible avec l'option de recharger ou de réinitialiser l'état local.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("CrewDesk — erreur de rendu :", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid h-dvh place-items-center p-6">
        <div className="glass max-w-md rounded-2xl p-7 text-center">
          <h1 className="font-display text-base font-bold tracking-wide">
            Un imprévu s&apos;est produit
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            L&apos;interface a rencontré une erreur. Tes données sont sauvegardées —
            recharge la page pour reprendre.
          </p>
          <p className="mt-3 rounded-lg border border-[rgba(255,138,76,0.25)] bg-[rgba(255,138,76,0.06)] px-3 py-2 font-mono text-[10px] break-words text-[#FF8A4C]">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="focus-ring rounded-lg border border-cyan/40 bg-cyan/15 px-3 py-1.5 font-display text-xs font-semibold text-cyan transition-colors hover:bg-cyan/25"
            >
              Recharger
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem("crewdesk-v1");
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              className="focus-ring rounded-lg border border-[rgba(234,240,248,0.12)] px-3 py-1.5 font-display text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              Réinitialiser le cache local
            </button>
          </div>
        </div>
      </div>
    );
  }
}
