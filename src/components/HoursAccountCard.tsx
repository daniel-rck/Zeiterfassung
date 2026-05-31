import { Gauge } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDecimalHours } from "../lib/format";
import { useEntries } from "../lib/hooks/useEntries";
import { useSettings } from "../lib/hooks/useSettings";
import { getRange } from "../lib/reports/range";
import { ProgressBar } from "./ui/ProgressBar";

export function HoursAccountCard() {
  const { settings } = useSettings();
  const target = settings.targetHoursPerWeek ?? 0;
  const { entries } = useEntries({ includeRunning: true });

  const range = useMemo(() => getRange("thisWeek", settings.weekStart), [settings.weekStart]);

  const weekSec = useMemo(() => {
    if (!range) return 0;
    return entries
      .filter((e) => e.startedAt >= range.from && e.startedAt <= range.to)
      .reduce((s, e) => s + e.durationSec, 0);
  }, [entries, range]);

  if (target <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[color:var(--color-surface-2)] text-[color:var(--color-text-3)]">
          <Gauge size={16} />
        </span>
        <div className="text-xs text-[color:var(--color-text-2)]">
          Stundenkonto aktiv —{" "}
          <Link
            to="/settings"
            className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
          >
            Wochen-Soll hinterlegen
          </Link>
          .
        </div>
      </div>
    );
  }

  const targetSec = target * 3600;
  const diffSec = weekSec - targetSec;
  const pct = Math.min(100, (weekSec / targetSec) * 100);
  const isAhead = diffSec >= 0;

  return (
    <div className="rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-3)]">
            Stundenkonto Woche
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="tnum font-mono text-xl font-semibold text-[color:var(--color-text-1)]">
              {formatDecimalHours(weekSec, settings.locale)} h
            </span>
            <span className="text-xs text-[color:var(--color-text-3)]">
              von {formatDecimalHours(targetSec, settings.locale)} h
            </span>
          </div>
        </div>
        <div
          className={`tnum inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
            isAhead
              ? "bg-[color:var(--color-success-500)]/10 text-[color:var(--color-success-600)] dark:text-[color:var(--color-success-500)]"
              : "bg-[color:var(--color-warn-500)]/10 text-[color:var(--color-warn-600)] dark:text-[color:var(--color-warn-500)]"
          }`}
        >
          {isAhead ? "+" : ""}
          {formatDecimalHours(diffSec, settings.locale)} h
        </div>
      </header>
      <div className="mt-3">
        <ProgressBar
          value={pct}
          tone={isAhead ? "success" : "brand"}
          label="Stundenkonto Fortschritt"
        />
        <div className="mt-1.5 flex justify-between text-2xs text-[color:var(--color-text-3)]">
          <span>0 h</span>
          <span className="tnum">{Math.round(pct)} %</span>
        </div>
      </div>
    </div>
  );
}
