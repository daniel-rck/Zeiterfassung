import { describe, expect, it } from 'vitest'
import { composeInvoice } from '../compose'
import type { TimeEntry } from '../../types'

function entry(over: Partial<TimeEntry>): TimeEntry {
  return {
    id: 'e' + Math.random(),
    description: '',
    startedAt: new Date('2026-05-10T09:00:00Z').getTime(),
    endedAt: new Date('2026-05-10T10:00:00Z').getTime(),
    durationSec: 3600,
    billable: true,
    tagIds: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

describe('composeInvoice', () => {
  it('rounds line amounts to cents and keeps the subtotal exact', () => {
    // Three 20-minute entries at 100 €/h each → 1/3 hour × 100 = 33.33…
    // Sum of unrounded amounts is 99.999999... → must round to 100.00.
    const entries = [
      entry({ id: 'a', durationSec: 1200, hourlyRateSnapshot: 100 }),
      entry({ id: 'b', durationSec: 1200, hourlyRateSnapshot: 100 }),
      entry({ id: 'c', durationSec: 1200, hourlyRateSnapshot: 100 }),
    ]
    const invoice = composeInvoice(entries, {
      groupBy: 'entry',
      roundToMinutes: 0,
      recipient: { name: 'Test' },
      range: { from: 0, to: Date.now() },
      issuer: { taxRate: 19 },
      currency: 'EUR',
    })
    // Each line rounded to 33.33 €
    expect(invoice.lineItems.every((l) => l.amount === 33.33)).toBe(true)
    // 33.33 * 3 = 99.99 (sum of cent-rounded line items)
    expect(invoice.subtotal).toBe(99.99)
    expect(invoice.taxAmount).toBe(19)
    expect(invoice.total).toBe(118.99)
  })

  it('rounds tax cleanly without floating-point drift', () => {
    const e = entry({ durationSec: 3600, hourlyRateSnapshot: 87.5 })
    const invoice = composeInvoice([e], {
      groupBy: 'entry',
      roundToMinutes: 0,
      recipient: { name: 'Test' },
      range: { from: 0, to: Date.now() },
      issuer: { taxRate: 7 },
      currency: 'EUR',
    })
    expect(invoice.subtotal).toBe(87.5)
    expect(invoice.taxAmount).toBe(6.13)
    expect(invoice.total).toBe(93.63)
  })

  it('skips tax when taxRate is undefined or zero', () => {
    const invoice = composeInvoice([entry({ hourlyRateSnapshot: 100 })], {
      groupBy: 'entry',
      roundToMinutes: 0,
      recipient: { name: 'Test' },
      range: { from: 0, to: Date.now() },
      issuer: {},
      currency: 'EUR',
    })
    expect(invoice.taxAmount).toBe(0)
    expect(invoice.total).toBe(100)
  })
})
