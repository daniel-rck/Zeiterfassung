import { Banknote, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDuration, formatTime } from "../lib/format";
import { useFeatures } from "../lib/hooks/useFeature";
import type { Project, Tag, TimeEntry } from "../lib/types";

export function EntryRow({
  entry,
  project,
  tags,
  locale,
  onDelete,
  showDate,
}: {
  entry: TimeEntry;
  project?: Project;
  tags: Tag[];
  locale: string;
  onDelete: (id: string) => void;
  showDate?: boolean;
}) {
  const features = useFeatures();
  const isRunning = entry.endedAt == null;

  return (
    <div
      className="group flex items-center gap-3 rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-3 py-2.5 transition-colors hover:bg-[color:var(--color-surface-2)]"
      aria-current={isRunning ? "true" : undefined}
    >
      <span
        aria-hidden="true"
        className="h-7 w-1 flex-shrink-0 rounded-full"
        style={{ backgroundColor: project?.color ?? "var(--color-border-strong)" }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-[color:var(--color-text-1)]">
            {entry.description || (
              <span className="text-[color:var(--color-text-3)]">Ohne Beschreibung</span>
            )}
          </span>
          {features.projects && project && (
            <span className="hidden truncate text-xs text-[color:var(--color-text-3)] sm:inline">
              · {project.name}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--color-text-3)]">
          <span className="tnum font-mono">
            {showDate &&
              new Intl.DateTimeFormat(locale, {
                day: "2-digit",
                month: "2-digit",
              }).format(entry.startedAt)}{" "}
            {formatTime(entry.startedAt, locale)}
            {entry.endedAt && ` – ${formatTime(entry.endedAt, locale)}`}
          </span>
          {features.tags &&
            tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded text-2xs font-medium"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
            ))}
          {features.tags && tags.length > 3 && <span className="text-2xs">+{tags.length - 3}</span>}
          {features.billing && entry.billable && (
            <span className="inline-flex items-center gap-0.5 text-[color:var(--color-success-600)] dark:text-[color:var(--color-success-500)]">
              <Banknote size={11} /> abrechenbar
            </span>
          )}
        </div>
      </div>

      <div
        className={`tnum flex-shrink-0 font-mono text-sm tabular-nums ${
          isRunning ? "text-brand-600 dark:text-brand-400" : "text-[color:var(--color-text-1)]"
        }`}
      >
        {formatDuration(entry.durationSec, "short")}
        {isRunning && (
          <span
            aria-hidden="true"
            className="ml-1.5 inline-block h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-brand-500 pulse-dot"
          />
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <Link
          to={`/entry/${entry.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-3)] opacity-0 transition-all hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-1)] group-hover:opacity-100 no-min-tap"
          aria-label="Eintrag bearbeiten"
        >
          <Pencil size={14} />
        </Link>
        {!isRunning && (
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-3)] opacity-0 transition-all hover:bg-[color:var(--color-danger-500)]/10 hover:text-[color:var(--color-danger-500)] group-hover:opacity-100 no-min-tap"
            aria-label="Eintrag löschen"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
