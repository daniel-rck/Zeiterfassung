import { useEffect, useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useSettings } from '../lib/hooks/useSettings'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { composeInvoice, type ComposedInvoice } from '../lib/invoice/compose'
import { downloadInvoicePdf } from '../lib/invoice/pdf'
import { bumpInvoiceNumberTo } from '../lib/db/settings'
import { saveInvoice } from '../lib/db/invoices'
import { formatDate, formatMoney } from '../lib/format'
import { getRange } from '../lib/reports/range'

export function InvoicePage() {
  const { settings } = useSettings()
  const { projects } = useProjects()
  const toast = useToast()

  const [projectId, setProjectId] = useState<string>('')
  const [from, setFrom] = useState(() => formatDateInput(getRange('lastMonth', settings.weekStart)?.from ?? Date.now()))
  const [to, setTo] = useState(() => formatDateInput(getRange('lastMonth', settings.weekStart)?.to ?? Date.now()))
  const [recipientName, setRecipientName] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(() =>
    settings.invoiceProfile?.nextInvoiceNumber != null
      ? String(settings.invoiceProfile.nextInvoiceNumber).padStart(4, '0')
      : '',
  )
  const [groupBy, setGroupBy] = useState<'entry' | 'day'>('day')

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id)
    }
  }, [projects, projectId])

  const range = useMemo(() => {
    if (!from || !to) return null
    const f = new Date(from)
    f.setHours(0, 0, 0, 0)
    const t = new Date(to)
    t.setHours(23, 59, 59, 999)
    return { from: f.getTime(), to: t.getTime() }
  }, [from, to])

  const { entries } = useEntries({
    from: range?.from,
    to: range?.to,
    projectId: projectId || undefined,
    billable: true,
  })

  const selectedProject = projects.find((p) => p.id === projectId)

  const invoice: ComposedInvoice | null = useMemo(() => {
    if (!range || !selectedProject || !recipientName.trim()) return null
    return composeInvoice(entries, {
      groupBy,
      roundToMinutes: settings.roundTo,
      recipient: {
        name: recipientName.trim(),
        address: recipientAddress.trim() || undefined,
      },
      invoiceNumber: invoiceNumber || undefined,
      project: selectedProject,
      range,
      issuer: settings.invoiceProfile ?? {},
      currency: selectedProject.currency ?? settings.currency,
      fallbackRate: settings.defaultHourlyRate,
    })
  }, [
    entries,
    range,
    selectedProject,
    recipientName,
    recipientAddress,
    invoiceNumber,
    groupBy,
    settings.invoiceProfile,
    settings.currency,
    settings.defaultHourlyRate,
    settings.roundTo,
  ])

  const handlePdf = async () => {
    if (!invoice) {
      toast.error('Bitte Empfänger und Zeitraum ausfüllen.')
      return
    }
    const filename = invoice.number
      ? `Rechnung-${invoice.number}.pdf`
      : `Rechnung-${formatDateInput(invoice.date)}.pdf`
    try {
      await downloadInvoicePdf(invoice, settings.locale, filename)
      await saveInvoice(invoice, { projectName: selectedProject?.name })
      if (invoice.number && settings.invoiceProfile) {
        const parsed = parseInt(invoice.number, 10)
        if (Number.isFinite(parsed)) {
          bumpInvoiceNumberTo(parsed + 1)
          setInvoiceNumber(String(parsed + 1).padStart(4, '0'))
        }
      }
      toast.success('PDF erstellt und im Archiv gespeichert')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Rechnung</h1>

      <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 print:hidden dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Projekt">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— wählen —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.client ? ` · ${p.client}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rechnungsnummer">
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="optional"
            />
          </Field>
          <Field label="Von">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Bis">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Empfänger-Name">
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Firma / Person"
            />
          </Field>
          <Field label="Empfänger-Adresse">
            <Textarea
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </Field>
          <Field label="Gruppierung">
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'entry' | 'day')}
            >
              <option value="day">Pro Tag (kompakt)</option>
              <option value="entry">Pro Eintrag</option>
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            icon={<Printer size={16} />}
            onClick={() => window.print()}
            disabled={!invoice}
          >
            Drucken
          </Button>
          <Button
            variant="primary"
            icon={<Download size={16} />}
            onClick={() => void handlePdf()}
            disabled={!invoice}
          >
            PDF erzeugen
          </Button>
        </div>
      </div>

      {invoice ? (
        <InvoicePreview invoice={invoice} locale={settings.locale} />
      ) : (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          Wähle Projekt, Zeitraum und Empfänger, um eine Rechnung zu erzeugen.
        </p>
      )}
    </div>
  )
}

function InvoicePreview({
  invoice,
  locale,
}: {
  invoice: ComposedInvoice
  locale: string
}) {
  return (
    <article className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-8 print:p-0 print:ring-0 dark:bg-zinc-900 dark:ring-zinc-800 print:dark:bg-white">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 print:text-black">
            Rechnung
          </h2>
          {invoice.number && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 print:text-black">
              Nr. {invoice.number}
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 print:text-black">
            Datum: {formatDate(invoice.date, locale)}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 print:text-black">
            Leistungszeitraum: {formatDate(invoice.range.from, locale)} – {formatDate(invoice.range.to, locale)}
          </p>
        </div>
        <div className="text-left text-sm text-zinc-700 sm:text-right dark:text-zinc-300 print:text-right print:text-black">
          {invoice.issuer.issuerName && (
            <div className="font-semibold">{invoice.issuer.issuerName}</div>
          )}
          {invoice.issuer.issuerAddress?.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {invoice.issuer.taxId && <div className="mt-1">Steuer-ID: {invoice.issuer.taxId}</div>}
        </div>
      </header>

      <section className="mb-8">
        <p className="text-xs uppercase tracking-wide text-zinc-500 print:text-black">
          Rechnung an
        </p>
        <p className="font-medium text-zinc-900 dark:text-zinc-100 print:text-black">
          {invoice.recipient.name}
        </p>
        {invoice.recipient.address?.split('\n').map((line, i) => (
          <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300 print:text-black">
            {line}
          </p>
        ))}
      </section>

      <ul className="space-y-3 sm:hidden print:hidden">
        {invoice.lineItems.map((item, i) => (
          <li
            key={i}
            className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {item.description}
            </div>
            {item.date && (
              <div className="mt-0.5 text-xs text-zinc-500">{item.date}</div>
            )}
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-zinc-500">Stunden</dt>
                <dd className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {item.hours.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Satz</dt>
                <dd className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {formatMoney(item.rate, invoice.currency, locale)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-zinc-500">Betrag</dt>
                <dd className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatMoney(item.amount, invoice.currency, locale)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 text-sm sm:hidden print:hidden">
        <div className="flex justify-between">
          <dt className="text-zinc-600 dark:text-zinc-400">Zwischensumme</dt>
          <dd className="font-mono tabular-nums">
            {formatMoney(invoice.subtotal, invoice.currency, locale)}
          </dd>
        </div>
        {invoice.taxRate != null && invoice.taxRate > 0 && (
          <div className="flex justify-between">
            <dt className="text-zinc-600 dark:text-zinc-400">
              USt. {invoice.taxRate.toFixed(0)} %
            </dt>
            <dd className="font-mono tabular-nums">
              {formatMoney(invoice.taxAmount, invoice.currency, locale)}
            </dd>
          </div>
        )}
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold dark:border-zinc-800">
          <dt>Gesamt</dt>
          <dd className="font-mono tabular-nums">
            {formatMoney(invoice.total, invoice.currency, locale)}
          </dd>
        </div>
      </dl>

      <table className="hidden w-full text-sm sm:table print:table">
        <thead>
          <tr className="border-b-2 border-zinc-300 text-left dark:border-zinc-700 print:border-black">
            <th className="py-2">Beschreibung</th>
            <th className="py-2 text-right">Stunden</th>
            <th className="py-2 text-right">Satz</th>
            <th className="py-2 text-right">Betrag</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, i) => (
            <tr
              key={i}
              className="border-b border-zinc-200 dark:border-zinc-800 print:border-black"
            >
              <td className="py-2">
                {item.date && <span className="text-zinc-500 mr-2 print:text-black">{item.date}</span>}
                {item.description}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">{item.hours.toFixed(2)}</td>
              <td className="py-2 text-right font-mono tabular-nums">
                {formatMoney(item.rate, invoice.currency, locale)}
              </td>
              <td className="py-2 text-right font-mono tabular-nums">
                {formatMoney(item.amount, invoice.currency, locale)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-3 text-right text-sm text-zinc-700 dark:text-zinc-300 print:text-black">
              Zwischensumme
            </td>
            <td className="pt-3 text-right font-mono tabular-nums">
              {formatMoney(invoice.subtotal, invoice.currency, locale)}
            </td>
          </tr>
          {invoice.taxRate != null && invoice.taxRate > 0 && (
            <tr>
              <td colSpan={3} className="text-right text-sm text-zinc-700 dark:text-zinc-300 print:text-black">
                USt. {invoice.taxRate.toFixed(0)} %
              </td>
              <td className="text-right font-mono tabular-nums">
                {formatMoney(invoice.taxAmount, invoice.currency, locale)}
              </td>
            </tr>
          )}
          <tr>
            <td
              colSpan={3}
              className="pt-2 text-right text-base font-semibold text-zinc-900 dark:text-zinc-100 print:text-black"
            >
              Gesamt
            </td>
            <td className="pt-2 text-right font-mono text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 print:text-black">
              {formatMoney(invoice.total, invoice.currency, locale)}
            </td>
          </tr>
        </tfoot>
      </table>

      {(invoice.issuer.iban ||
        invoice.issuer.bic ||
        invoice.issuer.bankName ||
        invoice.issuer.paymentNote) && (
        <section className="mt-8 text-sm text-zinc-700 dark:text-zinc-300 print:text-black">
          <p className="text-xs uppercase tracking-wide text-zinc-500 print:text-black">
            Zahlung
          </p>
          {invoice.issuer.bankName && <p>{invoice.issuer.bankName}</p>}
          {invoice.issuer.iban && <p>IBAN: {invoice.issuer.iban}</p>}
          {invoice.issuer.bic && <p>BIC: {invoice.issuer.bic}</p>}
          {invoice.issuer.paymentNote &&
            invoice.issuer.paymentNote.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </section>
      )}
    </article>
  )
}

function formatDateInput(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
