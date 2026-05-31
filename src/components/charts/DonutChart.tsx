import type { ReactNode } from "react";
import { useState } from "react";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
  display: string;
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  ariaLabel,
  size = 180,
}: {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: ReactNode;
  ariaLabel?: string;
  size?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0 || slices.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[color:var(--color-text-3)]"
        style={{ height: size }}
      >
        Keine Daten
      </div>
    );
  }

  const radius = size / 2;
  const inner = radius * 0.6;
  const cx = radius;
  const cy = radius;

  let acc = 0;
  const arcs = slices.map((s) => {
    const startA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const endA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = endA - startA > Math.PI ? 1 : 0;
    const x1 = cx + Math.cos(startA) * radius;
    const y1 = cy + Math.sin(startA) * radius;
    const x2 = cx + Math.cos(endA) * radius;
    const y2 = cy + Math.sin(endA) * radius;
    const xi1 = cx + Math.cos(endA) * inner;
    const yi1 = cy + Math.sin(endA) * inner;
    const xi2 = cx + Math.cos(startA) * inner;
    const yi2 = cy + Math.sin(startA) * inner;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { slice: s, path };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel}
        >
          {arcs.map(({ slice, path }) => {
            const isHover = hovered === slice.key;
            const isOther = hovered && !isHover;
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: SVG hover hit-area for tooltip, data is in the accessible img label
              <path
                key={slice.key}
                d={path}
                fill={slice.color}
                style={{
                  opacity: isOther ? 0.35 : 1,
                  transition: "opacity 150ms",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHovered(slice.key)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && (
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-3)]">
              {centerLabel}
            </div>
          )}
          {centerValue && (
            <div className="tnum mt-0.5 font-mono text-xl font-semibold text-[color:var(--color-text-1)]">
              {centerValue}
            </div>
          )}
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          const isHover = hovered === s.key;
          return (
            <li
              key={s.key}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                isHover ? "bg-[color:var(--color-surface-2)]" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[color:var(--color-text-1)]">
                {s.label}
              </span>
              <span className="tnum text-xs text-[color:var(--color-text-3)]">{pct}%</span>
              <span className="tnum text-xs font-medium text-[color:var(--color-text-2)]">
                {s.display}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
