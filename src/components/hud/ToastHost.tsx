"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Toast } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useCrewStore((s) => s.removeToast);

  useEffect(() => {
    const t = window.setTimeout(() => removeToast(toast.id), 4500);
    return () => window.clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="glass pointer-events-auto flex w-72 items-start gap-2.5 rounded-xl p-3"
      style={{ boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 18px ${toast.color}22` }}
      role="status"
    >
      <span
        className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: toast.color, boxShadow: `0 0 8px ${toast.color}` }}
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-semibold">{toast.title}</p>
        {toast.message ? (
          <p className="mt-0.5 truncate text-[11px] text-muted">{toast.message}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Fermer la notification"
        className="focus-ring shrink-0 text-xs text-muted transition-colors hover:text-foreground"
      >
        ×
      </button>
    </motion.div>
  );
}

/** Pile de notifications en verre dépoli, en haut à droite. */
export function ToastHost() {
  const toasts = useCrewStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed top-16 right-4 z-[70] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
