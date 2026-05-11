import type { ComposedInvoice } from './compose'
import { formatDate, formatMoney } from '../format'

export async function generateInvoicePdf(
  invoice: ComposedInvoice,
  locale: string,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 18
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Rechnung', margin, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (invoice.issuer.issuerName) {
    doc.text(invoice.issuer.issuerName, margin, y)
    y += 5
  }
  if (invoice.issuer.issuerAddress) {
    const lines = invoice.issuer.issuerAddress.split('\n')
    for (const line of lines) {
      doc.text(line, margin, y)
      y += 5
    }
  }
  if (invoice.issuer.taxId) {
    doc.text(`Steuer-ID: ${invoice.issuer.taxId}`, margin, y)
    y += 5
  }

  y = Math.max(y, margin + 10) + 8

  doc.setFont('helvetica', 'bold')
  doc.text('Rechnung an:', margin, y)
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(invoice.recipient.name, margin, y)
  y += 5
  if (invoice.recipient.address) {
    for (const line of invoice.recipient.address.split('\n')) {
      doc.text(line, margin, y)
      y += 5
    }
  }

  y += 5
  if (invoice.number) {
    doc.text(`Rechnungsnummer: ${invoice.number}`, margin, y)
    y += 5
  }
  doc.text(`Datum: ${formatDate(invoice.date, locale)}`, margin, y)
  y += 5
  doc.text(
    `Leistungszeitraum: ${formatDate(invoice.range.from, locale)} – ${formatDate(invoice.range.to, locale)}`,
    margin,
    y,
  )
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('Beschreibung', margin, y)
  doc.text('Stunden', margin + 110, y, { align: 'right' })
  doc.text('Satz', margin + 140, y, { align: 'right' })
  doc.text('Betrag', margin + 175, y, { align: 'right' })
  y += 2
  doc.line(margin, y, margin + 175, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  for (const item of invoice.lineItems) {
    if (y > 260) {
      doc.addPage()
      y = margin
    }
    const desc = item.date ? `${item.date} – ${item.description}` : item.description
    const descLines = doc.splitTextToSize(desc, 95)
    doc.text(descLines, margin, y)
    doc.text(item.hours.toFixed(2), margin + 110, y, { align: 'right' })
    doc.text(
      formatMoney(item.rate, invoice.currency, locale),
      margin + 140,
      y,
      { align: 'right' },
    )
    doc.text(
      formatMoney(item.amount, invoice.currency, locale),
      margin + 175,
      y,
      { align: 'right' },
    )
    y += Math.max(5, descLines.length * 5)
  }

  y += 4
  doc.line(margin + 110, y, margin + 175, y)
  y += 5

  doc.text('Zwischensumme', margin + 110, y)
  doc.text(formatMoney(invoice.subtotal, invoice.currency, locale), margin + 175, y, {
    align: 'right',
  })
  y += 5
  if (invoice.taxRate != null && invoice.taxRate > 0) {
    doc.text(`USt. ${invoice.taxRate.toFixed(0)}%`, margin + 110, y)
    doc.text(
      formatMoney(invoice.taxAmount, invoice.currency, locale),
      margin + 175,
      y,
      { align: 'right' },
    )
    y += 5
  }
  doc.setFont('helvetica', 'bold')
  doc.text('Gesamt', margin + 110, y)
  doc.text(formatMoney(invoice.total, invoice.currency, locale), margin + 175, y, {
    align: 'right',
  })
  y += 10

  // Optional payment block: IBAN / BIC / Bank / free-form note.
  const profile = invoice.issuer
  const hasPayment =
    profile.iban || profile.bic || profile.bankName || profile.paymentNote
  if (hasPayment) {
    doc.setFont('helvetica', 'bold')
    doc.text('Zahlung', margin, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    if (profile.bankName) {
      doc.text(profile.bankName, margin, y)
      y += 5
    }
    if (profile.iban) {
      doc.text(`IBAN: ${profile.iban}`, margin, y)
      y += 5
    }
    if (profile.bic) {
      doc.text(`BIC: ${profile.bic}`, margin, y)
      y += 5
    }
    if (profile.paymentNote) {
      for (const line of doc.splitTextToSize(profile.paymentNote, 175) as string[]) {
        doc.text(line, margin, y)
        y += 5
      }
    }
  }

  return doc.output('blob')
}

export async function downloadInvoicePdf(
  invoice: ComposedInvoice,
  locale: string,
  filename: string,
): Promise<void> {
  const blob = await generateInvoicePdf(invoice, locale)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
