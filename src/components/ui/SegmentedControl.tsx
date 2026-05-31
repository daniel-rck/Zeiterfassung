import type { ReactNode } from "react";

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
  size = "md",
  block,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  block?: boolean;
}) {
  const heightClass = size === "sm" ? "h-8" : "h-9";
  const itemHeight = size === "sm" ? "h-7" : "h-8";
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0.5 rounded-md bg-[color:var(--color-surface-2)] p-0.5 ring-1 ring-inset ring-[color:var(--color-border-subtle)] ${heightClass} ${block ? "w-full" : ""}`}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.value)}
            className={`no-min-tap inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-3 text-xs font-medium transition-colors duration-150 ${itemHeight} ${
              active
                ? "bg-[color:var(--color-surface-1)] text-[color:var(--color-text-1)] shadow-xs"
                : "text-[color:var(--color-text-2)] hover:text-[color:var(--color-text-1)]"
            }`}
          >
            {seg.icon}
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
