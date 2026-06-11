"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ChatMessage } from "@/services/types";
import { useMounted } from "@/lib/useMounted";
import { askAtlas } from "@/services/orchestrator";
import { useCrewStore } from "@/stores/useCrewStore";
import { PlanCard } from "@/components/chat/PlanCard";
import { TypingDots } from "@/components/chat/TypingDots";

const SUGGESTIONS = [
  "Je veux lancer une landing page pour mon app de fitness",
  "Prépare une séquence d'emails de bienvenue",
  "Organise un webinaire de lancement pour la bêta",
];

function AtlasAvatar() {
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
      style={{
        background: "radial-gradient(circle at 35% 30%, #ffffff, #cfeefd 55%, #6fb7d8)",
        boxShadow: "0 0 14px rgba(94,231,255,0.5)",
      }}
      aria-hidden
    >
      <svg width="13" height="13" viewBox="0 0 32 32">
        <path d="M16 7 27 13.5 16 20 5 13.5Z" fill="#07090E" opacity="0.85" />
        <circle cx="16" cy="13.5" r="2.4" fill="#5EE7FF" />
      </svg>
    </span>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const pendingPlan = useCrewStore((s) => s.pendingPlan);
  const isAtlas = msg.role === "atlas";
  const plan = msg.planId && pendingPlan?.id === msg.planId ? pendingPlan : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`flex gap-2 ${isAtlas ? "" : "flex-row-reverse"}`}
    >
      {isAtlas ? <AtlasAvatar /> : null}
      <div className={`min-w-0 ${isAtlas ? "max-w-[88%]" : "max-w-[80%]"}`}>
        <div
          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
            isAtlas
              ? "rounded-tl-sm border border-[rgba(94,231,255,0.15)] bg-[rgba(16,22,31,0.85)] text-foreground"
              : "rounded-tr-sm border border-[rgba(234,240,248,0.1)] bg-[rgba(94,231,255,0.1)] text-foreground"
          }`}
        >
          {msg.text}
          {plan ? <PlanCard plan={plan} /> : null}
        </div>
        <time className="label-mono mt-1 block px-1 text-[8.5px]">
          {new Date(msg.at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </motion.div>
  );
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Le chat avec Atlas : on décrit un besoin, il propose un plan d'équipe. */
export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const mounted = useMounted();
  const messages = useCrewStore((s) => s.chatMessages);
  const planning = useCrewStore((s) => s.planning);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suivre le fil : défile en bas à chaque nouveau message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, planning, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || planning) return;
    setDraft("");
    void askAtlas(trimmed);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass fixed right-4 bottom-20 left-4 z-40 flex h-[min(72dvh,640px)] flex-col rounded-2xl sm:left-auto sm:w-[400px]"
          role="dialog"
          aria-label="Chat avec Atlas"
        >
          <header className="flex items-center gap-2.5 border-b border-[rgba(234,240,248,0.07)] px-4 py-3">
            <AtlasAvatar />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-bold tracking-wide">Atlas</p>
              <p className="label-mono mt-0.5">
                {planning ? "analyse en cours…" : "orchestrateur · en ligne"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le chat"
              className="focus-ring rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              ×
            </button>
          </header>

          <div
            ref={listRef}
            className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
            role="log"
            aria-live="polite"
          >
            {mounted && messages.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs leading-relaxed text-muted">
                  Décris ton besoin en langage naturel — je le découpe en tâches et je
                  briefe l&apos;équipe.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="focus-ring rounded-xl border border-[rgba(94,231,255,0.2)] bg-[rgba(94,231,255,0.05)] px-3 py-2 text-left text-[11px] text-foreground/85 transition-colors hover:bg-[rgba(94,231,255,0.1)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {mounted
              ? messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              : null}
            {planning ? (
              <div className="flex items-center gap-2">
                <AtlasAvatar />
                <div className="rounded-2xl rounded-tl-sm border border-[rgba(94,231,255,0.15)] bg-[rgba(16,22,31,0.85)] px-3 py-2">
                  <TypingDots />
                </div>
              </div>
            ) : null}
          </div>

          <form
            className="flex items-end gap-2 border-t border-[rgba(234,240,248,0.07)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              rows={1}
              placeholder={planning ? "Atlas réfléchit…" : "Décris ton besoin…"}
              disabled={planning}
              aria-label="Message pour Atlas"
              className="focus-ring max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-[rgba(234,240,248,0.1)] bg-[rgba(7,9,14,0.5)] px-3 py-2 text-xs text-foreground placeholder:text-muted/70 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={planning || draft.trim() === ""}
              aria-label="Envoyer"
              className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan/40 bg-cyan/15 text-cyan transition-colors hover:bg-cyan/25 disabled:opacity-40"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2 8 14 2 10 14 7.5 9.5 2 8Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
