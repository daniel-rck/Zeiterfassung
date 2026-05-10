import type { DayBucket } from '../lib/reports/aggregate'

export function ReportChart({
  buckets,
  locale,
}: {
  buckets: DayBucket[]
  locale: string
}) {
  if (buckets.length === 0) {
    return <p className="text-sm text-zinc-500">Keine Daten im gewählten Zeitraum.</p>
  }
  const maxSec = Math.max(1, ...buckets.map((b) => b.durationSec))
  return (
    <div className="space-y-1.5">
      {buckets.map((bucket) => {
        const hours = bucket.durationSec / 3600
        const widthPct = (bucket.durationSec / maxSec) * 100
        const date = new Date(bucket.day)
        const label = new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }).format(date)
        return (
          <div key={bucket.day} className="flex items-center gap-2 text-xs">
            <div className="w-20 flex-shrink-0 text-zinc-500">{label}</div>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
              <div
                className="absolute inset-y-0 left-0 rounded bg-brand-500"
                style={{ width: `${widthPct}%` }}
              />
              <span className="absolute inset-0 flex items-center px-2 font-mono tabular-nums text-zinc-800 dark:text-zinc-100">
                {hours.toFixed(2)}h
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
