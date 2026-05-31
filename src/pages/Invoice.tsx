import { Download, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { saveInvoice } from "../lib/db/invoices";
import { bumpInvoiceNumberTo } from "../lib/db/settings";
import { formatDate, formatMoney } from "../lib/format";
import { useEntries } from "../lib/hooks/useEntries";
import { useProjects } from "../lib/hooks/useProjects";
import { useSettings } from "../lib/hooks/useSettings";
import { type ComposedInvoice, composeInvoice } from "../lib/invoice/compose";
import { downloadInvoicePdf } from "../lib/invoice/pdf";
import { getRange } from "../lib/reports/range";

export function InvoicePage() {
  const { settings } = useSettings();
  const { projects } = useProjects();
  const toast = useToast();

  const [projectId, setProjectId] = useState<string>("");
  const [from, setFrom] = useState(() =>
    formatDateInput(getRange("lastMonth", settings.weekStart)?.from ?? Date.now()),
  );
  const [to, setTo] = useState(() =>
    formatDateInput(getRange("lastMonth", settings.weekStart)?.to ?? Date.now()),
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(() =>
    settings.invoiceProfile?.nextInvoiceNumber != null
      ? String(settings.invoiceProfile.nextInvoiceNumber).padStart(4, "0")
      : "",
  );
  const [groupBy, setGroupBy] = useState<"entry" | "day">("day");

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const range = useMemo(() => {
    if (!from || !to) return null;
    const f = new Date(from);
    f.setHours(0, 0, 0, 0);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    return { from: f.getTime(), to: t.getTime() };
  }, [from, to]);

  const { entries } = useEntries({
    from: range?.from,
    to: range?.to,
    projectId: projectId || undefined,
    billable: true,
  });

  const selectedProject = projects.find((p) => p.id === projectId);

  const invoice: ComposedInvoice | null = useMemo(() => {
    if (!range || !selectedProject || !recipientName.trim()) return null;
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
    });
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
  ]);

  const handlePdf = async () => {
    if (!invoice) {
      toast.error("Bitte Empfänger und Zeitraum ausfüllen.");
      return;
    }
    const filename = invoice.number
      ? `Rechnung-${invoice.number}.pdf`
      : `Rechnung-${formatDateInput(invoice.date)}.pdf`;
    try {
      await downloadInvoicePdf(invoice, settings.locale, filename);
      await saveInvoice(invoice, { projectName: selectedProject?.name });
      if (invoice.number && settings.invoiceProfile) {
        const parsed = parseInt(invoice.number, 10);
        if (Number.isFinite(parsed)) {
          bumpInvoiceNumberTo(parsed + 1);
          setInvoiceNumber(String(parsed + 1).padStart(4, "0"));
        }
      }
      toast.success("PDF erstellt und im Archiv gespeichert");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
          Rechnung
        </h1>
        <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
          Erzeuge eine PDF aus abrechenbaren Einträgen eines Projekts.
        </p>
      </div>

      <Card padding="md" className="print:hidden">
        <CardHeader title="Daten" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Projekt">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— wählen —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.client ? ` · ${p.client}` : ""}
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
            <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as "entry" | "day")}>
              <option value="day">Pro Tag (kompakt)</option>
              <option value="entry">Pro Eintrag</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            icon={<Printer size={14} />}
            onClick={() => window.print()}
            disabled={!invoice}
          >
            Drucken
          </Button>
          <Button
            variant="primary"
            icon={<Download size={14} />}
            onClick={() => void handlePdf()}
            disabled={!invoice}
          >
            PDF erzeugen
          </Button>
        </div>
      </Card>

      {invoice ? (
        <InvoicePreview invoice={invoice} locale={settings.locale} />
      ) : (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-8 text-center text-sm text-[color:var(--color-text-3)]">
          Wähle Projekt, Zeitraum und Empfänger, um eine Rechnung zu erzeugen.
        </div>
      )}
    </div>
  );
}

const rowCls = "border-b border-[color:var(--color-border-subtle)] print:border-black";

function InvoicePreview({ invoice, locale }: { invoice: ComposedInvoice; locale: string }) {
  return (
    <article className="rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5 sm:p-8 print:border-0 print:p-0 print:bg-white print:text-black">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-0">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-text-1)] print:text-black">
            Rechnung
          </h2>
          {invoice.number && (
            <p className="mt-1 text-sm text-[color:var(--color-text-2)] print:text-black">
              Nr. {invoice.number}
            </p>
          )}
          <p className="mt-1 text-sm text-[color:var(--color-text-2)] print:text-black">
            Datum: {formatDate(invoice.date, locale)}
          </p>
          <p className="text-sm text-[color:var(--color-text-2)] print:text-black">
            Leistungszeitraum: {formatDate(invoice.range.from, locale)} –{" "}
            {formatDate(invoice.range.to, locale)}
          </p>
        </div>
        <div className="text-left text-sm text-[color:var(--color-text-2)] sm:text-right print:text-right print:text-black">
          {invoice.issuer.issuerName && (
            <div className="font-semibold text-[color:var(--color-text-1)] print:text-black">
              {invoice.issuer.issuerName}
            </div>
          )}
          {invoice.issuer.issuerAddress?.split("\n").map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static address lines, fixed order
            <div key={i}>{line}</div>
          ))}
          {invoice.issuer.taxId && <div className="mt-1">Steuer-ID: {invoice.issuer.taxId}</div>}
        </div>
      </header>

      <section className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-3)] print:text-black">
          Rechnung an
        </p>
        <p className="mt-1 font-medium text-[color:var(--color-text-1)] print:text-black">
          {invoice.recipient.name}
        </p>
        {invoice.recipient.address?.split("\n").map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static address lines, fixed order
          <p key={i} className="text-sm text-[color:var(--color-text-2)] print:text-black">
            {line}
          </p>
        ))}
      </section>

      <ul className="space-y-3 sm:hidden print:hidden">
        {invoice.lineItems.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: composed invoice line items, fixed order
          <li key={i} className="rounded-md border border-[color:var(--color-border-subtle)] p-3">
            <div className="text-sm font-medium text-[color:var(--color-text-1)]">
              {item.description}
            </div>
            {item.date && (
              <div className="mt-0.5 text-xs text-[color:var(--color-text-3)]">{item.date}</div>
            )}
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-[color:var(--color-text-3)]">Stunden</dt>
                <dd className="tnum font-mono">{item.hours.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--color-text-3)]">Satz</dt>
                <dd className="tnum font-mono">
                  {formatMoney(item.rate, invoice.currency, locale)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-[color:var(--color-text-3)]">Betrag</dt>
                <dd className="tnum font-mono text-sm font-semibold">
                  {formatMoney(item.amount, invoice.currency, locale)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 text-sm sm:hidden print:hidden">
        <div className="flex justify-between">
          <dt className="text-[color:var(--color-text-2)]">Zwischensumme</dt>
          <dd className="tnum font-mono">
            {formatMoney(invoice.subtotal, invoice.currency, locale)}
          </dd>
        </div>
        {invoice.taxRate != null && invoice.taxRate > 0 && (
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-text-2)]">
              USt. {invoice.taxRate.toFixed(0)} %
            </dt>
            <dd className="tnum font-mono">
              {formatMoney(invoice.taxAmount, invoice.currency, locale)}
            </dd>
          </div>
        )}
        <div className="flex justify-between border-t border-[color:var(--color-border-subtle)] pt-2 text-base font-semibold">
          <dt>Gesamt</dt>
          <dd className="tnum font-mono">{formatMoney(invoice.total, invoice.currency, locale)}</dd>
        </div>
      </dl>

      <table className="hidden w-full text-sm sm:table print:table">
        <thead>
          <tr className="border-b-2 border-[color:var(--color-border-strong)] text-left print:border-black">
            <th className="py-2 font-medium text-[color:var(--color-text-2)]">Beschreibung</th>
            <th className="py-2 text-right font-medium text-[color:var(--color-text-2)]">
              Stunden
            </th>
            <th className="py-2 text-right font-medium text-[color:var(--color-text-2)]">Satz</th>
            <th className="py-2 text-right font-medium text-[color:var(--color-text-2)]">Betrag</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: composed invoice line items, fixed order
            <tr key={i} className={rowCls}>
              <td className="py-2">
                {item.date && (
                  <span className="mr-2 text-[color:var(--color-text-3)] print:text-black">
                    {item.date}
                  </span>
                )}
                {item.description}
              </td>
              <td className="tnum py-2 text-right font-mono">{item.hours.toFixed(2)}</td>
              <td className="tnum py-2 text-right font-mono">
                {formatMoney(item.rate, invoice.currency, locale)}
              </td>
              <td className="tnum py-2 text-right font-mono">
                {formatMoney(item.amount, invoice.currency, locale)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={3}
              className="pt-3 text-right text-sm text-[color:var(--color-text-2)] print:text-black"
            >
              Zwischensumme
            </td>
            <td className="tnum pt-3 text-right font-mono">
              {formatMoney(invoice.subtotal, invoice.currency, locale)}
            </td>
          </tr>
          {invoice.taxRate != null && invoice.taxRate > 0 && (
            <tr>
              <td
                colSpan={3}
                className="text-right text-sm text-[color:var(--color-text-2)] print:text-black"
              >
                USt. {invoice.taxRate.toFixed(0)} %
              </td>
              <td className="tnum text-right font-mono">
                {formatMoney(invoice.taxAmount, invoice.currency, locale)}
              </td>
            </tr>
          )}
          <tr>
            <td
              colSpan={3}
              className="pt-2 text-right text-base font-semibold text-[color:var(--color-text-1)] print:text-black"
            >
              Gesamt
            </td>
            <td className="tnum pt-2 text-right font-mono text-base font-semibold">
              {formatMoney(invoice.total, invoice.currency, locale)}
            </td>
          </tr>
        </tfoot>
      </table>

      {(invoice.issuer.iban ||
        invoice.issuer.bic ||
        invoice.issuer.bankName ||
        invoice.issuer.paymentNote) && (
        <section className="mt-8 text-sm text-[color:var(--color-text-2)] print:text-black">
          <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-3)] print:text-black">
            Zahlung
          </p>
          <div className="mt-1 space-y-0.5">
            {invoice.issuer.bankName && <p>{invoice.issuer.bankName}</p>}
            {invoice.issuer.iban && <p>IBAN: {invoice.issuer.iban}</p>}
            {invoice.issuer.bic && <p>BIC: {invoice.issuer.bic}</p>}
            {invoice.issuer.paymentNote &&
              invoice.issuer.paymentNote
                .split("\n")
                // biome-ignore lint/suspicious/noArrayIndexKey: static payment-note lines, fixed order
                .map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </section>
      )}
    </article>
  );
}

function formatDateInput(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
