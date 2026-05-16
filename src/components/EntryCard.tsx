import { Link } from 'react-router-dom'
import { Pencil, Trash2, Banknote } from 'lucide-react'
import type { Project, Tag, TimeEntry } from '../lib/types'
import { formatDuration, formatTime } from '../lib/format'
import { useFeatures } from '../lib/hooks/useFeature'

export function EntryCard({
  entry,
  project,
  tags,
  locale,
  onDelete,
}: {
  entry: TimeEntry
  project?: Project
  tags: Tag[]
  locale: string
  onDelete: (id: string) => void
}) {
  const features = useFeatures()
  const isRunning = entry.endedAt == null

  return (
    <div
      className="flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-zinc-200 hover:ring-zinc-300 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-zinc-700"
      aria-current={isRunning ? 'true' : undefined}
    >
      <div
        className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
        style={{ backgroundColor: project?.color ?? '#9ca3af' }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {entry.description || (
              <span className="italic text-zinc-500 dark:text-zinc-400">Ohne Beschreibung</span>
            )}
          </div>
          <div
            className={`flex-shrink-0 font-mono text-sm tabular-nums ${
              isRunning ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {formatDuration(entry.durationSec, 'long')}
            {isRunning && <span className="ml-1 animate-pulse">●</span>}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {features.projects && project && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{project.name}</span>
          )}
          <span>
            {formatTime(entry.startedAt, locale)}
            {entry.endedAt && ` – ${formatTime(entry.endedAt, locale)}`}
          </span>
          {features.tags &&
            tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          {features.billing && entry.billable && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Banknote size={12} /> abrechenbar
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          to={`/entry/${entry.id}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Eintrag bearbeiten"
        >
          <Pencil size={18} />
        </Link>
        {!isRunning && (
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            aria-label="Eintrag löschen"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
