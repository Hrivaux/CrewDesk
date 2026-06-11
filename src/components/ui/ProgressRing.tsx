interface ProgressRingProps {
  /** 0 → 100 */
  value: number;
  color: string;
  size?: number;
  stroke?: number;
}

export function ProgressRing({ value, color, size = 60, stroke = 5 }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(234,240,248,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{
            filter: `drop-shadow(0 0 5px ${color}88)`,
            transition: "stroke-dashoffset 0.6s ease",
          }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[11px] font-medium tabular-nums">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
