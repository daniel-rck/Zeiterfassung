import type { DayBucket } from '../lib/reports/aggregate'
import { BarChart, type BarDatum } from './charts/BarChart'
import { formatDecimalHours } from '../lib/format'

export function ReportChart({
  buckets,
  locale,
}: {
  buckets: DayBucket[]
  locale: string
}) {
  if (buckets.length === 0) {
    return (
      <p className="text-sm text-[color:var(--color-text-3)]">
        Keine Daten im gewählten Zeitraum.
      </p>
    )
  }

  const data: BarDatum[] = buckets.map((b) => {
    const date = new Date(b.day)
    return {
      key: b.day,
      label: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
      }).format(date),
      value: b.durationSec,
      display: `${formatDecimalHours(b.durationSec, locale)} h`,
    }
  })

  return (
    <BarChart
      data={data}
      ariaLabel="Stunden pro Tag"
      axisFormat={(sec) => `${Math.round(sec / 3600)}h`}
    />
  )
}
