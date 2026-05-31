import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type DeltaTone = "success" | "danger" | "neutral";

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon,
  accent,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: { value: ReactNode; tone?: DeltaTone };
  icon?: ReactNode;
  accent?: "brand" | "success" | "warn" | "danger";
  children?: ReactNode;
}) {
  const accentBar =
    accent === "brand"
      ? "bg-brand-500"
      : accent === "success"
        ? "bg-[color:var(--color-success-500)]"
        : accent === "warn"
          ? "bg-[color:var(--color-warn-500)]"
          : accent === "danger"
            ? "bg-[color:var(--color-danger-500)]"
            : null;

  const deltaTone = delta?.tone ?? "neutral";
  const DeltaIcon =
    deltaTone === "success" ? TrendingUp : deltaTone === "danger" ? TrendingDown : Minus;
  const deltaColor =
    deltaTone === "success"
      ? "text-[color:var(--color-success-600)] dark:text-[color:var(--color-success-500)]"
      : deltaTone === "danger"
        ? "text-[color:var(--color-danger-600)] dark:text-[color:var(--color-danger-500)]"
        : "text-[color:var(--color-text-3)]";

  return (
    <div className="relative overflow-hidden rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
      {accentBar && (
        <span aria-hidden="true" className={`absolute left-0 top-0 h-full w-0.5 ${accentBar}`} />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-3)]">
          {label}
        </div>
        {icon && <span className="text-[color:var(--color-text-3)]">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tnum font-mono text-2xl font-semibold leading-none tracking-tight text-[color:var(--color-text-1)]">
          {value}
        </span>
        {delta && (
          <span
            className={`tnum inline-flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}
          >
            <DeltaIcon size={12} />
            {delta.value}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-[color:var(--color-text-3)]">{hint}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
