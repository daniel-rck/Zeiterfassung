import { useMemo } from 'react'
import { Gauge, TrendingUp, TrendingDown } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useSettings } from '../lib/hooks/useSettings'
import { getRange } from '../lib/reports/range'
import { formatDecimalHours } from '../lib/format'

export function HoursAccountCard() {
  const { settings } = useSettings()
  const target = settings.targetHoursPerWeek ?? 0
  const { entries } = useEntries({ includeRunning: true })

  const range = useMemo(() => getRange('thisWeek', settings.weekStart), [settings.weekStart])

  const weekSec = useMemo(() => {
    if (!range) return 0
    return entries
      .filter((e) => e.startedAt >= range.from && e.startedAt <= range.to)
      .reduce((s, e) => s + e.durationSec, 0)
  }, [entries, range])

  if (target <= 0) {
    return (
      <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
            <Gauge size={18} />
          </span>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Stundenkonto aktiv — hinterlege ein Wochen-Soll in den{' '}
            <a href="/settings" className="text-brand-600 underline">
              Einstellungen
            </a>
            .
          </div>
        </div>
      </section>
    )
  }

  const targetSec = target * 3600
  const diffSec = weekSec - targetSec
  const pct = Math.min(100, (weekSec / targetSec) * 100)
  const isAhead = diffSec >= 0

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/30">
            <Gauge size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Diese Woche</h2>
            <p className="text-xs text-zinc-500">
              Soll {formatDecimalHours(targetSec, settings.locale)} h
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {isAhead ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="font-mono tabular-nums">
            {isAhead ? '+' : ''}
            {formatDecimalHours(diffSec, settings.locale)} h
          </span>
        </div>
      </header>
      <div className="mt-3">
        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          <div
            className={`h-full rounded-full transition-[width] ${
              isAhead ? 'bg-emerald-500' : 'bg-brand-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-zinc-500">
          <span className="font-mono tabular-nums">{formatDecimalHours(weekSec, settings.locale)} h</span>
          <span>{Math.round(pct)} %</span>
        </div>
      </div>
    </section>
  )
}
