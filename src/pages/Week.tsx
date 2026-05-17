import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
} from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { dayKey } from '../lib/db'
import { formatDuration, formatDecimalHours } from '../lib/format'
import { EntryRow } from '../components/EntryRow'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { deleteEntry, restoreEntry } from '../lib/db/timeEntries'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'

function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  const dow = out.getDay()
  const diff = (dow - weekStart + 7) % 7
  out.setDate(out.getDate() - diff)
  return out
}

export function WeekPage() {
  const { settings } = useSettings()
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects()
  const { tags } = useTags()
  const confirm = useConfirm()
  const toast = useToast()

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  )
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const [weekOffset, setWeekOffset] = useState(0)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const weekStartDate = useMemo(() => {
    const base = startOfWeek(new Date(), settings.weekStart)
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset, settings.weekStart])

  const days = useMemo(() => {
    const arr: {
      date: Date
      key: string
      entries: typeof entries
      sec: number
    }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate)
      d.setDate(d.getDate() + i)
      const key = dayKey(d.getTime())
      const dayEntries = entries.filter((e) => dayKey(e.startedAt) === key)
      const sec = dayEntries.reduce((s, e) => s + e.durationSec, 0)
      arr.push({ date: d, key, entries: dayEntries, sec })
    }
    return arr
  }, [entries, weekStartDate])

  const weekTotalSec = days.reduce((s, d) => s + d.sec, 0)
  const target = settings.targetHoursPerWeek
  const targetSec = target ? target * 3600 : null

  const dayFmt = new Intl.DateTimeFormat(settings.locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
  const longFmt = new Intl.DateTimeFormat(settings.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const todayKey = dayKey(Date.now())

  const handleDelete = async (id: string) => {
    const snapshot = entries.find((e) => e.id === id)
    const ok = await confirm.confirm({
      title: 'Eintrag löschen?',
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteEntry(id)
    toast.success('Gelöscht', {
      action: snapshot
        ? { label: 'Rückgängig', onClick: () => void restoreEntry(snapshot) }
        : undefined,
    })
  }

  const rangeLabel = `${longFmt
    .format(weekStartDate)
    .replace(/, \d+ .*/, '')} – ${longFmt
    .format(days[6].date)
    .replace(/^\w+,\s*/, '')}`

  const maxDaySec = Math.max(1, ...days.map((d) => d.sec))

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Wochenübersicht
          </h1>
          <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
            {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Vorherige Woche"
            icon={<ChevronLeft size={14} />}
          />
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Heute
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Nächste Woche"
            icon={<ChevronsRight size={14} />}
          />
        </div>
      </header>

      <Card padding="md">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-3)]">
            Gesamtzeit
          </div>
          <div className="tnum font-mono text-2xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            {formatDuration(weekTotalSec, 'short')}
          </div>
        </div>
        {targetSec != null && (
          <div className="mt-3">
            <ProgressBar
              value={Math.min(100, (weekTotalSec / targetSec) * 100)}
              tone={weekTotalSec >= targetSec ? 'success' : 'brand'}
              label="Wochen-Fortschritt"
            />
            <div className="mt-1.5 flex justify-between text-xs text-[color:var(--color-text-3)]">
              <span>
                Soll {formatDecimalHours(targetSec, settings.locale)} h
              </span>
              <span className="tnum font-mono">
                {weekTotalSec >= targetSec ? '+' : ''}
                {formatDecimalHours(weekTotalSec - targetSec, settings.locale)} h
              </span>
            </div>
          </div>
        )}
      </Card>

      <ul className="space-y-1.5">
        {days.map((day) => {
          const isToday = day.key === todayKey
          const isOpen = expanded[day.key] ?? false
          const pct = day.sec > 0 ? (day.sec / maxDaySec) * 100 : 0
          return (
            <li
              key={day.key}
              className={`overflow-hidden rounded-lg border transition-colors ${
                isToday
                  ? 'border-brand-300 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20'
                  : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)]'
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [day.key]: !isOpen }))
                }
                className="flex w-full items-center gap-3 p-3 text-left"
                aria-expanded={isOpen}
                disabled={day.entries.length === 0}
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[color:var(--color-text-3)]">
                  {day.entries.length === 0 ? (
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-border-strong)]" />
                  ) : isOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-text-1)]">
                    {dayFmt.format(day.date)}
                    {isToday && (
                      <span className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        heute
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[color:var(--color-text-3)]">
                    {day.entries.length}{' '}
                    {day.entries.length === 1 ? 'Eintrag' : 'Einträge'}
                  </div>
                </div>
                <div className="hidden w-28 flex-shrink-0 sm:block">
                  {day.sec > 0 && (
                    <div className="h-1 rounded-full bg-[color:var(--color-surface-3)]">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="tnum flex-shrink-0 font-mono text-sm tabular-nums text-[color:var(--color-text-1)]">
                  {day.sec > 0 ? formatDuration(day.sec, 'short') : '–'}
                </div>
              </button>
              {isOpen && day.entries.length > 0 && (
                <div className="space-y-1.5 border-t border-[color:var(--color-border-subtle)] p-3">
                  {day.entries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      project={
                        entry.projectId
                          ? projectMap.get(entry.projectId)
                          : undefined
                      }
                      tags={
                        entry.tagIds
                          .map((id) => tagMap.get(id))
                          .filter(Boolean) as typeof tags
                      }
                      locale={settings.locale}
                      onDelete={(id) => void handleDelete(id)}
                    />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
