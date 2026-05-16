import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronLeft, ChevronsRight } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { dayKey } from '../lib/db'
import { formatDuration, formatDecimalHours } from '../lib/format'
import { EntryCard } from '../components/EntryCard'
import { Button } from '../components/ui/Button'
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

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const [weekOffset, setWeekOffset] = useState(0)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const weekStartDate = useMemo(() => {
    const base = startOfWeek(new Date(), settings.weekStart)
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset, settings.weekStart])

  const days = useMemo(() => {
    const arr: { date: Date; key: string; entries: typeof entries; sec: number }[] = []
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

  const dayFmt = new Intl.DateTimeFormat(settings.locale, { weekday: 'short', day: '2-digit', month: '2-digit' })
  const longFmt = new Intl.DateTimeFormat(settings.locale, { weekday: 'long', day: 'numeric', month: 'long' })
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

  const rangeLabel = `${longFmt.format(weekStartDate).replace(/, \d+ .*/, '')} – ${longFmt
    .format(days[6].date)
    .replace(/^\w+,\s*/, '')}`

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Wochenübersicht
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Vorherige Woche"
            icon={<ChevronLeft size={16} />}
          />
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Heute
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Nächste Woche"
            icon={<ChevronsRight size={16} />}
          />
        </div>
      </header>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm text-zinc-500">{rangeLabel}</div>
          <div className="font-mono text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatDuration(weekTotalSec, 'short')}
          </div>
        </div>
        {targetSec != null && (
          <div className="mt-2">
            <div
              className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.round((weekTotalSec / targetSec) * 100))}
            >
              <div
                className={`h-full rounded-full ${
                  weekTotalSec >= targetSec ? 'bg-emerald-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, (weekTotalSec / targetSec) * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-zinc-500">
              <span>Soll: {formatDecimalHours(targetSec, settings.locale)} h</span>
              <span>
                {weekTotalSec >= targetSec ? '+' : ''}
                {formatDecimalHours(weekTotalSec - targetSec, settings.locale)} h
              </span>
            </div>
          </div>
        )}
      </section>

      <ul className="space-y-2">
        {days.map((day) => {
          const isToday = day.key === todayKey
          const isOpen = expanded[day.key] ?? false
          return (
            <li
              key={day.key}
              className={`overflow-hidden rounded-xl ring-1 transition-colors ${
                isToday
                  ? 'bg-brand-50/50 ring-brand-200 dark:bg-brand-950/20 dark:ring-brand-900'
                  : 'bg-white ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded((e) => ({ ...e, [day.key]: !isOpen }))}
                className="flex w-full items-center gap-3 p-3 text-left"
                aria-expanded={isOpen}
                disabled={day.entries.length === 0}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-zinc-400">
                  {day.entries.length === 0 ? (
                    <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  ) : isOpen ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {dayFmt.format(day.date)}
                    {isToday && <span className="ml-2 text-xs text-brand-600">heute</span>}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {day.entries.length} {day.entries.length === 1 ? 'Eintrag' : 'Einträge'}
                  </div>
                </div>
                <div className="flex-shrink-0 font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                  {day.sec > 0 ? formatDuration(day.sec, 'short') : '–'}
                </div>
              </button>
              {isOpen && day.entries.length > 0 && (
                <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
                  {day.entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      project={entry.projectId ? projectMap.get(entry.projectId) : undefined}
                      tags={entry.tagIds.map((id) => tagMap.get(id)).filter(Boolean) as typeof tags}
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
