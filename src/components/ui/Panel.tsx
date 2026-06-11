import type { HTMLAttributes, ReactNode } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Panel({ children, className = "", ...rest }: PanelProps) {
  return (
    <div className={`glass rounded-2xl ${className}`} {...rest}>
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  hint?: string;
  children?: ReactNode;
}

export function PanelHeader({ title, hint, children }: PanelHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-4 pt-3.5 pb-2">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-[13px] font-semibold tracking-wide text-foreground">
          {title}
        </h2>
        {hint ? <span className="label-mono">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
