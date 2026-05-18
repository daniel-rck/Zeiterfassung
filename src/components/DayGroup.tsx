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
      <header className="flex items-baseline justify-between border-b border-[color:var(--color-border-subtle)] pb-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-3)]">
          {formatRelativeDay(dayTimestamp, locale)}
        </h3>
        <div className="flex items-baseline gap-3 text-xs text-[color:var(--color-text-3)]">
          <span className="tnum font-mono">{hours} h</span>
          {amount != null && amount > 0 && currency && (
            <span className="tnum font-mono text-[color:var(--color-success-600)] dark:text-[color:var(--color-success-500)]">
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
