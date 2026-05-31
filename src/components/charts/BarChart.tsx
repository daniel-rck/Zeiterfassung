import { useState } from "react";
import { niceTicks } from "./useChartScales";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  display: string;
  highlight?: boolean;
}

export function BarChart({
  data,
  ariaLabel,
  height = 220,
  axisFormat,
}: {
  data: BarDatum[];
  ariaLabel?: string;
  height?: number;
  axisFormat?: (value: number) => string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[color:var(--color-text-3)]">
        Keine Daten im gewählten Zeitraum.
      </div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = niceTicks(max, 4);
  const yMax = ticks[ticks.length - 1];

  const padLeft = 36;
  const padTop = 12;
  const padBottom = 28;
  const padRight = 8;

  const chartH = height - padTop - padBottom;
  const totalWidth = 100; // viewBox %
  const chartW = totalWidth - padLeft - padRight;
  const slot = chartW / data.length;
  const barWidth = Math.min(slot * 0.7, 5);

  const yFor = (value: number) => padTop + chartH - (value / yMax) * chartH;

  return (
    <figure aria-label={ariaLabel} className="relative m-0 w-full" style={{ height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Grid lines */}
        {ticks.map((t) => (
          <line
            key={t}
            x1={padLeft}
            x2={totalWidth - padRight}
            y1={yFor(t)}
            y2={yFor(t)}
            stroke="var(--color-border-subtle)"
            strokeWidth={0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const x = padLeft + i * slot + (slot - barWidth) / 2;
          const y = yFor(d.value);
          const h = padTop + chartH - y;
          const active = hovered === d.key;
          return (
            <g key={d.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, h)}
                rx={0.6}
                className={d.highlight || active ? "fill-brand-600" : "fill-brand-500"}
                style={{
                  transition: "opacity 150ms",
                  opacity: hovered && !active ? 0.5 : 1,
                }}
              />
              {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG hover hit-area for tooltip, data is in the accessible figure label */}
              <rect
                x={padLeft + i * slot}
                y={padTop}
                width={slot}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}
      </svg>

      {/* Y axis labels (text, separate from scaled svg to keep readable) */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full"
        style={{ width: `${padLeft}%` }}
      >
        {ticks.map((t) => {
          const ratio = yFor(t) / height;
          return (
            <span
              key={t}
              className="tnum absolute right-2 -translate-y-1/2 text-2xs text-[color:var(--color-text-3)]"
              style={{ top: `${ratio * 100}%` }}
            >
              {axisFormat ? axisFormat(t) : t}
            </span>
          );
        })}
      </div>

      {/* X axis labels */}
      <div
        className="pointer-events-none absolute bottom-0 flex"
        style={{
          left: `${padLeft}%`,
          right: `${padRight}%`,
          height: `${padBottom}px`,
        }}
      >
        {data.map((d, i) => {
          // For dense X axis, hide some labels
          const totalLabels = Math.min(data.length, 7);
          const interval = Math.max(1, Math.floor(data.length / totalLabels));
          const visible = i % interval === 0 || i === data.length - 1;
          return (
            <div
              key={d.key}
              className="flex-1 truncate pt-1 text-center text-2xs text-[color:var(--color-text-3)]"
            >
              {visible ? d.label : " "}
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hovered &&
        (() => {
          const i = data.findIndex((d) => d.key === hovered);
          if (i < 0) return null;
          const d = data[i];
          const xPct = ((padLeft + i * slot + slot / 2) / totalWidth) * 100;
          const isRight = xPct > 70;
          return (
            <div
              className="pointer-events-none absolute z-10 -translate-y-full whitespace-nowrap rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-2 py-1 text-xs shadow-md"
              style={{
                left: isRight ? undefined : `${xPct}%`,
                right: isRight ? `${100 - xPct}%` : undefined,
                top: `${(yFor(d.value) / height) * 100}%`,
                transform: isRight ? "translate(8px, -100%)" : "translate(-50%, -100%)",
              }}
            >
              <div className="font-medium text-[color:var(--color-text-1)]">{d.label}</div>
              <div className="tnum text-[color:var(--color-text-2)]">{d.display}</div>
            </div>
          );
        })()}

      {/* SR-only table */}
      <table className="sr-only">
        <thead>
          <tr>
            <th>Kategorie</th>
            <th>Wert</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{d.display}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
