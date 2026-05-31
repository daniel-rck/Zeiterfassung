import { Download, FileText, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useConfirm } from "../components/ui/Confirm";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { subscribe } from "../lib/db/broadcast";
import { deleteInvoice, listInvoices } from "../lib/db/invoices";
import { formatDate, formatMoney } from "../lib/format";
import { useSettings } from "../lib/hooks/useSettings";
import type { ComposedInvoice } from "../lib/invoice/compose";
import { downloadInvoicePdf } from "../lib/invoice/pdf";
import type { StoredInvoice } from "../lib/types";

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
  };
}

export function InvoicesPage() {
  const { settings } = useSettings();
  const toast = useToast();
  const confirm = useConfirm();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await listInvoices();
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribe((m) => {
      if (m.type === "invoice-changed" || m.type === "invoice-deleted" || m.type === "db-cleared") {
        void reload();
      }
    });
  }, [reload]);

  const handleDownload = async (record: StoredInvoice) => {
    try {
      const filename = record.number
        ? `Rechnung-${record.number}.pdf`
        : `Rechnung-${new Date(record.date).toISOString().slice(0, 10)}.pdf`;
      await downloadInvoicePdf(storedToComposed(record), settings.locale, filename);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (record: StoredInvoice) => {
    const ok = await confirm.confirm({
      title: "Rechnung aus Archiv entfernen?",
      description:
        "Der Eintrag wird gelöscht. Bereits heruntergeladene PDFs bleiben auf deinem Gerät.",
      tone: "danger",
      confirmLabel: "Entfernen",
    });
    if (!ok) return;
    await deleteInvoice(record.id);
    toast.success("Aus Archiv entfernt");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Rechnungs-Archiv
          </h1>
          <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
            {loading ? "Lädt …" : `${invoices.length} Rechnungen`}
          </p>
        </div>
        <Link to="/invoice">
          <Button variant="primary" size="sm" icon={<FileText size={14} />}>
            Neue Rechnung
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-1.5">
          <Skeleton h={56} w="100%" />
          <Skeleton h={56} w="100%" />
          <Skeleton h={56} w="100%" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-8 text-center text-sm text-[color:var(--color-text-3)]">
          Noch keine Rechnungen erstellt. Erzeuge eine PDF auf der Rechnungs-Seite, dann landet sie
          hier.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {invoices.map((record) => (
            <li
              key={record.id}
              className="group flex flex-wrap items-center gap-3 rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-3 py-2.5 transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              <FileText size={14} className="flex-shrink-0 text-[color:var(--color-text-3)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[color:var(--color-text-1)]">
                  {record.number ? `Rechnung ${record.number}` : "Rechnung"} ·{" "}
                  {record.recipient.name}
                </div>
                <div className="truncate text-xs text-[color:var(--color-text-3)]">
                  {formatDate(record.date, settings.locale)}
                  {record.projectName ? ` · ${record.projectName}` : ""}
                </div>
              </div>
              <span className="tnum text-sm font-medium text-[color:var(--color-text-1)]">
                {formatMoney(record.total, record.currency, settings.locale)}
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  size="xs"
                  variant="outline"
                  icon={<Download size={12} />}
                  onClick={() => void handleDownload(record)}
                >
                  PDF
                </Button>
                <button
                  type="button"
                  onClick={() => void handleDelete(record)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--color-text-3)] opacity-0 transition hover:bg-[color:var(--color-danger-500)]/10 hover:text-[color:var(--color-danger-500)] group-hover:opacity-100 no-min-tap"
                  aria-label="Entfernen"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
