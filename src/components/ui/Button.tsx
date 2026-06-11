"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-cyan/15 border border-cyan/40 text-cyan hover:bg-cyan/25 shadow-[0_0_18px_rgba(94,231,255,0.18)]",
  ghost:
    "bg-transparent border border-[rgba(234,240,248,0.12)] text-foreground hover:bg-[rgba(234,240,248,0.06)]",
};

export function Button({ variant = "ghost", className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-colors duration-150 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
