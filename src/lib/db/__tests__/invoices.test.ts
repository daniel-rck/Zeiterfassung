import { describe, expect, it } from 'vitest'
import { deleteInvoice, listInvoices, saveInvoice } from '../invoices'
import type { ComposedInvoice } from '../../invoice/compose'

function composed(over: Partial<ComposedInvoice> = {}): ComposedInvoice {
  return {
    number: '0001',
    date: new Date('2026-05-10T12:00:00Z').getTime(),
    recipient: { name: 'Kunde A' },
    issuer: { issuerName: 'Mein Büro' },
    project: undefined,
    range: { from: 0, to: 1 },
    currency: 'EUR',
    lineItems: [
      { description: 'Tag X', hours: 1, rate: 100, amount: 100 },
    ],
    subtotal: 100,
    taxAmount: 19,
    taxRate: 19,
    total: 119,
    ...over,
  }
}

describe('invoices store', () => {
  it('persists a composed invoice and lists newest first', async () => {
    const earlier = await saveInvoice(composed({ date: 1, number: 'A' }), {})
    const later = await saveInvoice(composed({ date: 2, number: 'B' }), {})
    const all = await listInvoices()
    expect(all.map((r) => r.id)).toEqual([later.id, earlier.id])
    expect(all[0].total).toBe(119)
  })

  it('deletes an archived invoice', async () => {
    const record = await saveInvoice(composed(), {})
    await deleteInvoice(record.id)
    expect(await listInvoices()).toHaveLength(0)
  })
})
