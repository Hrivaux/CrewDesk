import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Chip({ children, color, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${className}`}
      style={
        color
          ? { color, borderColor: `${color}55`, background: `${color}14` }
          : { color: "var(--color-muted)", borderColor: "var(--hairline-strong)" }
      }
    >
      {children}
    </span>
  );
}
