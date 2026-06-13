"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";
import { AccountChip } from "@/components/hud/AccountChip";
import { TokenMeter } from "@/components/hud/TokenMeter";
import { WorkspacePanel } from "@/components/hud/WorkspacePanel";
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
  { href: "/configurer", label: "Configurer" },
  { href: "/board", label: "Board" },
  { href: "/projects", label: "Projets" },
] as const;

function NavLinks({ pathname, scope }: { pathname: string; scope: "desktop" | "mobile" }) {
  return (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring relative flex-1 rounded-lg px-3 py-1.5 text-center font-display text-xs font-semibold transition-[color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] md:flex-none ${
              active ? "text-cyan" : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
            {active ? (
              <motion.span
                layoutId={`nav-glow-${scope}`}
                className="absolute inset-0 -z-10 rounded-lg border border-cyan/30 bg-cyan/10 shadow-[inset_0_1px_0_rgba(234,240,248,0.12),0_0_22px_rgba(114,227,245,0.10)]"
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              />
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

function ModeChip() {
  const mounted = useMounted();
  const live = useCrewStore((s) => s.liveMode);
  const provider = useCrewStore((s) => s.liveProvider);
  if (!mounted) return <Chip>· · ·</Chip>;
  return live ? (
    <Chip color="#3CDFA0">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3CDFA0] shadow-[0_0_6px_#3CDFA0]" />
      Live · {provider === "openai" ? "GPT" : "Claude"}
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
      className="sticky top-0 z-30 shrink-0 px-3 pt-3"
    >
      <div className="mx-auto flex min-h-14 max-w-[1440px] flex-col gap-2 rounded-2xl border border-[rgba(234,240,248,0.1)] bg-[rgba(9,14,21,0.72)] px-3 py-2 shadow-[0_18px_60px_rgba(2,7,13,0.42),inset_0_1px_0_rgba(234,240,248,0.1)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-4 md:justify-start md:gap-7">
          <Logo />
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 rounded-xl bg-[rgba(234,240,248,0.035)] p-1 md:flex">
            <NavLinks pathname={pathname} scope="desktop" />
          </nav>
          <span className="md:hidden">
            <ModeChip />
          </span>
        </div>
        <nav aria-label="Navigation principale mobile" className="flex items-center gap-1 rounded-xl bg-[rgba(234,240,248,0.035)] p-1 md:hidden">
          <NavLinks pathname={pathname} scope="mobile" />
        </nav>
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <span className="hidden sm:inline-flex">
            <Clock />
          </span>
          <WorkspacePanel />
          <TokenMeter />
          <ModeChip />
          <AccountChip />
        </div>
      </div>
    </motion.header>
  );
}
