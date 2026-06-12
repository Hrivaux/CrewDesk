"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatTokens, formatUSD } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { Button } from "@/components/ui/Button";

/**
 * Compteur de consommation API : tokens + coût, et budget utilisateur
 * avec restant affiché. (Le solde réel du compte Anthropic n'est pas
 * exposé par l'API : on mesure ce que CrewDesk consomme.)
 */
export function TokenMeter() {
  const mounted = useMounted();
  const live = useCrewStore((s) => s.liveMode);
  const spend = useCrewStore((s) => s.spend);
  const budgetUSD = useCrewStore((s) => s.budgetUSD);
  const setBudgetUSD = useCrewStore((s) => s.setBudgetUSD);
  const resetSpend = useCrewStore((s) => s.resetSpend);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  if (!mounted || !live) return null;

  const remaining = budgetUSD !== null ? budgetUSD - spend.costUSD : null;
  const ratio =
    budgetUSD !== null && budgetUSD > 0 ? spend.costUSD / budgetUSD : 0;
  const color =
    remaining === null
      ? "#7E8CA0"
      : ratio >= 1
        ? "#FF8A4C"
        : ratio >= 0.75
          ? "#FFB35C"
          : "#3CDFA0";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(budgetUSD !== null ? String(budgetUSD) : "");
          setOpen((o) => !o);
        }}
        aria-label="Consommation API et budget"
        aria-expanded={open}
        className="focus-ring flex items-center gap-2 rounded-lg border border-[rgba(234,240,248,0.1)] px-2.5 py-1 transition-colors hover:bg-[rgba(234,240,248,0.05)]"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="font-mono text-[10px] text-foreground/85 tabular-nums">
          {formatUSD(spend.costUSD)}
        </span>
        {remaining !== null ? (
          <span className="font-mono text-[10px] tabular-nums" style={{ color }}>
            · reste {formatUSD(Math.max(0, remaining))}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass absolute top-9 right-0 z-50 w-64 rounded-xl p-3"
          >
            <p className="label-mono">Consommation CrewDesk</p>
            <div className="mt-2 flex flex-col gap-1 font-mono text-[10px] text-foreground/85 tabular-nums">
              <span className="flex justify-between">
                <span className="text-muted">Coût total</span>
                {formatUSD(spend.costUSD)}
              </span>
              <span className="flex justify-between">
                <span className="text-muted">Tokens entrée</span>
                {formatTokens(spend.inputTokens)}
              </span>
              <span className="flex justify-between">
                <span className="text-muted">Tokens sortie</span>
                {formatTokens(spend.outputTokens)}
              </span>
            </div>

            <p className="label-mono mt-3">Budget ($)</p>
            {budgetUSD !== null ? (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(234,240,248,0.08)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ratio * 100)}%`,
                    background: color,
                    boxShadow: `0 0 8px ${color}99`,
                  }}
                />
              </div>
            ) : null}
            <div className="mt-2 flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                inputMode="decimal"
                placeholder="ex. 20"
                aria-label="Budget en dollars"
                className="focus-ring w-20 rounded-lg border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-2 py-1 font-mono text-[11px] text-foreground tabular-nums placeholder:text-muted/60"
              />
              <Button
                variant="primary"
                onClick={() => {
                  const value = Number(draft.replace(",", "."));
                  setBudgetUSD(Number.isFinite(value) && value > 0 ? value : null);
                }}
              >
                Définir
              </Button>
              {budgetUSD !== null ? (
                <Button onClick={() => setBudgetUSD(null)}>Retirer</Button>
              ) : null}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Mesuré localement (l&apos;API n&apos;expose pas le solde du compte).
            </p>
            <button
              type="button"
              onClick={resetSpend}
              className="focus-ring label-mono mt-1 transition-colors hover:text-[#FF8A4C]"
            >
              Remettre le compteur à zéro
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
