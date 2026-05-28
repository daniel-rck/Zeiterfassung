import type { Project, TimeEntry, InvoiceProfile } from '../types'
import { dayKey } from '../db'
import { roundDurationSec } from '../duration'
import { roundCents } from '../money'

// Rounding policy: every line amount is rounded to cents up front, then
// subtotal/tax/total are derived from the already-rounded numbers. This
// trades a possible 1-cent remainder vs. the unrounded sum for the
// invoice invariant "line items add up to the displayed subtotal".

export interface InvoiceLineItem {
  description: string
  date?: string
  hours: number
  rate: number
  amount: number
}

export interface ComposedInvoice {
  number?: string
  date: number
  recipient: {
    name: string
    address?: string
  }
  issuer: InvoiceProfile
  project?: Project
  range: { from: number; to: number }
  currency: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRate?: number
  taxAmount: number
  total: number
}

export interface ComposeOptions {
  groupBy: 'entry' | 'day'
  roundToMinutes: 0 | 1 | 5 | 15 | 30
  recipient: { name: string; address?: string }
  invoiceNumber?: string
  invoiceDate?: number
  project?: Project
  range: { from: number; to: number }
  issuer: InvoiceProfile
  currency: string
  fallbackRate?: number
}

export function composeInvoice(
  entries: TimeEntry[],
  options: ComposeOptions,
): ComposedInvoice {
  const billable = entries.filter((e) => e.billable && e.durationSec > 0)
  const lineItems: InvoiceLineItem[] = []
  if (options.groupBy === 'day') {
    const byDay = new Map<string, { sec: number; rate: number | undefined; descriptions: Set<string> }>()
    for (const e of billable) {
      const day = dayKey(e.startedAt)
      const rate =
        e.hourlyRateSnapshot ?? options.project?.hourlyRate ?? options.fallbackRate
      const bucket = byDay.get(day) ?? {
        sec: 0,
        rate,
        descriptions: new Set<string>(),
      }
      bucket.sec += roundDurationSec(e.durationSec, options.roundToMinutes)
      if (e.description) bucket.descriptions.add(e.description)
      byDay.set(day, bucket)
    }
    const ordered = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b))
    for (const [day, bucket] of ordered) {
      const hours = bucket.sec / 3600
      const rate = bucket.rate ?? 0
      const description =
        bucket.descriptions.size > 0
          ? Array.from(bucket.descriptions).join('; ')
          : 'Geleistete Stunden'
      lineItems.push({
        description,
        date: day,
        hours,
        rate,
        amount: roundCents(hours * rate),
      })
    }
  } else {
    for (const e of billable.slice().sort((a, b) => a.startedAt - b.startedAt)) {
      const rate =
        e.hourlyRateSnapshot ?? options.project?.hourlyRate ?? options.fallbackRate ?? 0
      const sec = roundDurationSec(e.durationSec, options.roundToMinutes)
      const hours = sec / 3600
      lineItems.push({
        description: e.description || 'Geleistete Stunden',
        date: dayKey(e.startedAt),
        hours,
        rate,
        amount: roundCents(hours * rate),
      })
    }
  }
  const subtotal = roundCents(lineItems.reduce((s, l) => s + l.amount, 0))
  const taxRate = options.issuer.taxRate
  const taxAmount = taxRate ? roundCents(subtotal * (taxRate / 100)) : 0
  const total = roundCents(subtotal + taxAmount)
  return {
    number: options.invoiceNumber,
    date: options.invoiceDate ?? Date.now(),
    recipient: options.recipient,
    issuer: options.issuer,
    project: options.project,
    range: options.range,
    currency: options.currency,
    lineItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
  }
}
