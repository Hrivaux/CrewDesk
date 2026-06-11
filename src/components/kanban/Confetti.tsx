"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface ConfettiProps {
  color: string;
  onDone: () => void;
}

interface Piece {
  x: number;
  y: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
}

/** Micro-célébration : éclat discret de confettis aux couleurs de l'agent. */
export function Confetti({ color, onDone }: ConfettiProps) {
  const pieces = useMemo<Piece[]>(() => {
    const palette = [color, "#EAF0F8", color, "#FFFFFF"];
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 34 + Math.random() * 46;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.7 - 22,
        size: 3 + Math.random() * 4,
        color: palette[i % palette.length] ?? color,
        rotate: (Math.random() - 0.5) * 540,
        delay: Math.random() * 0.08,
      };
    });
  }, [color]);

  useEffect(() => {
    const t = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/3"
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.6 }}
          transition={{ duration: 0.95, ease: "easeOut", delay: p.delay }}
          style={{
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 1,
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}
