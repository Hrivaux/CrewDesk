interface StatProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function Stat({ label, value, accent }: StatProps) {
  return (
    <div className="group relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-xl border border-[rgba(234,240,248,0.08)] bg-[rgba(234,240,248,0.035)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(234,240,248,0.07)] transition-[border-color,background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[rgba(234,240,248,0.14)] hover:bg-[rgba(234,240,248,0.055)]">
      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px opacity-70"
        style={accent ? { background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` } : undefined}
      />
      <span className="label-mono">{label}</span>
      <span
        className="font-display text-2xl leading-none font-bold tabular-nums"
        style={accent ? { color: accent, textShadow: `0 0 18px ${accent}66` } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
