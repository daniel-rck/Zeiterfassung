import { useCallback, useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import type { StoredInvoice } from '../lib/types'
import { deleteInvoice, listInvoices } from '../lib/db/invoices'
import { downloadInvoicePdf } from '../lib/invoice/pdf'
import { useSettings } from '../lib/hooks/useSettings'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/Confirm'
import { formatDate, formatMoney } from '../lib/format'
import { subscribe } from '../lib/db/broadcast'
import type { ComposedInvoice } from '../lib/invoice/compose'

function storedToComposed(record: StoredInvoice): ComposedInvoice {
  return {
    number: record.number,
    date: record.date,
    recipient: record.recipient,
    issuer: record.issuer,
    project: undefined,
    range: record.range,
    currency: record.currency,
    lineItems: record.lineItems.map((l) => ({ ...l })),
    subtotal: record.subtotal,
    taxRate: record.taxRate,
    taxAmount: record.taxAmount,
    total: record.total,
  }
}

export function InvoicesPage() {
  const { settings } = useSettings()
  const toast = useToast()
  const confirm = useConfirm()
  const [invoices, setInvoices] = useState<StoredInvoice[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const data = await listInvoices()
      setInvoices(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    return subscribe((m) => {
      if (
        m.type === 'invoice-changed' ||
        m.type === 'invoice-deleted' ||
        m.type === 'db-cleared'
      ) {
        void reload()
      }
    })
  }, [reload])

  const handleDownload = async (record: StoredInvoice) => {
    try {
      const filename = record.number
        ? `Rechnung-${record.number}.pdf`
        : `Rechnung-${new Date(record.date).toISOString().slice(0, 10)}.pdf`
      await downloadInvoicePdf(storedToComposed(record), settings.locale, filename)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleDelete = async (record: StoredInvoice) => {
    const ok = await confirm.confirm({
      title: 'Rechnung aus Archiv entfernen?',
      description:
        'Der Eintrag wird gelöscht. Bereits heruntergeladene PDFs bleiben auf deinem Gerät.',
      tone: 'danger',
      confirmLabel: 'Entfernen',
    })
    if (!ok) return
    await deleteInvoice(record.id)
    toast.success('Aus Archiv entfernt')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Rechnungs-Archiv</h1>
      {loading ? (
        <p className="text-sm text-zinc-500">Lädt …</p>
      ) : invoices.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          Noch keine Rechnungen erstellt. Erzeuge eine PDF auf der Rechnungs-Seite, dann landet sie hier.
        </p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((record) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {record.number ? `Rechnung ${record.number}` : 'Rechnung'} ·{' '}
                  {record.recipient.name}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  {formatDate(record.date, settings.locale)}
                  {record.projectName ? ` · ${record.projectName}` : ''} ·{' '}
                  {formatMoney(record.total, record.currency, settings.locale)}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                icon={<Download size={14} />}
                onClick={() => void handleDownload(record)}
              >
                PDF
              </Button>
              <button
                type="button"
                onClick={() => void handleDelete(record)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 no-min-tap"
                aria-label="Entfernen"
                title="Entfernen"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
