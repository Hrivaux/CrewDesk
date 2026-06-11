interface ProgressBarProps {
  /** 0 → 100 */
  value: number;
  color: string;
  className?: string;
}

export function ProgressBar({ value, color, className = "" }: ProgressBarProps) {
  return (
    <div
      className={`h-1 overflow-hidden rounded-full bg-[rgba(234,240,248,0.08)] ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          boxShadow: `0 0 8px ${color}99`,
        }}
      />
    </div>
  );
}
