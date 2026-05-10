import type { ReactNode } from 'react'
import { formatRelativeDay } from '../lib/format'

export function DayGroup({
  dayTimestamp,
  totalSec,
  amount,
  currency,
  locale,
  children,
}: {
  dayTimestamp: number
  totalSec: number
  amount?: number
  currency?: string
  locale: string
  children: ReactNode
}) {
  const hours = (totalSec / 3600).toFixed(2)
  return (
    <section className="space-y-2">
      <header className="flex items-baseline justify-between border-b border-zinc-200 pb-1 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {formatRelativeDay(dayTimestamp, locale)}
        </h3>
        <div className="text-xs text-zinc-500">
          <span className="font-mono tabular-nums">{hours}h</span>
          {amount != null && amount > 0 && currency && (
            <span className="ml-2">
              {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
              }).format(amount)}
            </span>
          )}
        </div>
      </header>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}
