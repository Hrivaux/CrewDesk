interface StatProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function Stat({ label, value, accent }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-[rgba(234,240,248,0.07)] bg-[rgba(234,240,248,0.03)] px-3 py-2.5">
      <span className="label-mono">{label}</span>
      <span
        className="font-display text-xl leading-none font-bold tabular-nums"
        style={accent ? { color: accent, textShadow: `0 0 18px ${accent}66` } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
