import { newId } from "../ids";
import type { ComposedInvoice } from "../invoice/compose";
import type { StoredInvoice } from "../types";
import { broadcast } from "./broadcast";
import { getDB } from "./index";

export async function saveInvoice(
  composed: ComposedInvoice,
  meta: { projectName?: string },
): Promise<StoredInvoice> {
  const record: StoredInvoice = {
    id: newId(),
    number: composed.number,
    date: composed.date,
    recipient: composed.recipient,
    issuer: composed.issuer,
    projectId: composed.project?.id,
    projectName: meta.projectName ?? composed.project?.name,
    range: composed.range,
    currency: composed.currency,
    lineItems: composed.lineItems.map((l) => ({ ...l })),
    subtotal: composed.subtotal,
    taxRate: composed.taxRate,
    taxAmount: composed.taxAmount,
    total: composed.total,
    createdAt: Date.now(),
  };
  const db = await getDB();
  await db.add("invoices", record);
  broadcast({ type: "invoice-changed", id: record.id });
  return record;
}

export async function listInvoices(): Promise<StoredInvoice[]> {
  const db = await getDB();
  const all = await db.getAll("invoices");
  return all.sort((a, b) => b.date - a.date);
}

export async function getInvoice(id: string): Promise<StoredInvoice | undefined> {
  const db = await getDB();
  return db.get("invoices", id);
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("invoices", id);
  broadcast({ type: "invoice-deleted", id });
}
