"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-cyan/15 border border-cyan/40 text-cyan hover:bg-cyan/24 shadow-[0_0_22px_rgba(114,227,245,0.16),inset_0_1px_0_rgba(234,240,248,0.12)]",
  ghost:
    "bg-[rgba(234,240,248,0.025)] border border-[rgba(234,240,248,0.12)] text-foreground hover:bg-[rgba(234,240,248,0.07)]",
};

export function Button({ variant = "ghost", className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-[background-color,border-color,box-shadow,transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
