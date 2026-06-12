"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { AccountChip } from "@/components/hud/AccountChip";
import { TokenMeter } from "@/components/hud/TokenMeter";
import { Chip } from "@/components/ui/Chip";

function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("fr-FR", { hour12: false }));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs tracking-[0.2em] text-muted tabular-nums">
      {time ?? "--:--:--"}
    </span>
  );
}

function Logo() {
  return (
    <Link href="/" className="focus-ring flex items-center gap-3">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <path
          d="M16 7 27 13.5 16 20 5 13.5Z"
          fill="#10161F"
          stroke="#5EE7FF"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M5 13.5V18L16 24.5 27 18V13.5L16 20Z"
          fill="#0B1119"
          stroke="#5EE7FF"
          strokeWidth="1.1"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <circle cx="16" cy="13.5" r="2.4" fill="#5EE7FF" />
      </svg>
      <span className="flex flex-col">
        <span className="font-display text-sm leading-none font-bold tracking-wide">
          CrewDesk
        </span>
        <span className="label-mono mt-1">Mission Control</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/", label: "Scène" },
  { href: "/board", label: "Board" },
  { href: "/projects", label: "Projets" },
] as const;

function ModeChip() {
  const mounted = useMounted();
  const live = useCrewStore((s) => s.liveMode);
  if (!mounted) return <Chip>· · ·</Chip>;
  return live ? (
    <Chip color="#3CDFA0">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3CDFA0] shadow-[0_0_6px_#3CDFA0]" />
      Live · Claude
    </Chip>
  ) : (
    <Chip color="#FFB35C">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_6px_#FFB35C]" />
      Simulation
    </Chip>
  );
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex h-14 shrink-0 items-center justify-between border-b border-[rgba(234,240,248,0.07)] px-5"
    >
      <div className="flex items-center gap-7">
        <Logo />
        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring relative rounded-lg px-3 py-1.5 font-display text-xs font-semibold transition-colors duration-150 ${
                  active ? "text-cyan" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-glow"
                    className="absolute inset-0 -z-10 rounded-lg border border-cyan/30 bg-cyan/10"
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Clock />
        <TokenMeter />
        <ModeChip />
        <AccountChip />
      </div>
    </motion.header>
  );
}
