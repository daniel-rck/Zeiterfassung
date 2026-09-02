export type DetailLevel = "basis" | "standard" | "pro" | "proplus";

export const DETAIL_LEVEL_ORDER: Record<DetailLevel, number> = {
  basis: 0,
  standard: 1,
  pro: 2,
  proplus: 3,
};

export interface Project {
  id: string;
  name: string;
  client?: string;
  color: string;
  hourlyRate?: number;
  currency?: string;
  billableDefault: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TimeEntry {
  id: string;
  projectId?: string;
  description: string;
  startedAt: number;
  endedAt?: number;
  durationSec: number;
  billable: boolean;
  tagIds: string[];
  notes?: string;
  hourlyRateSnapshot?: number;
  currencySnapshot?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Break {
  id: string;
  entryId: string;
  startedAt: number;
  endedAt?: number;
  durationSec: number;
  auto?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceProfile {
  issuerName?: string;
  issuerAddress?: string;
  taxRate?: number;
  taxId?: string;
  nextInvoiceNumber?: number;
  iban?: string;
  bic?: string;
  bankName?: string;
  paymentNote?: string;
}

export interface FeatureFlags {
  projects: boolean;
  tags: boolean;
  reports: boolean;
  billing: boolean;
  invoicing: boolean;
  breaks: boolean;
  hoursAccount: boolean;
  weeklyView: boolean;
}

export type FeatureName = keyof FeatureFlags;

export interface Settings {
  detailLevel: DetailLevel;
  onboardingCompleted: boolean;
  defaultBillable: boolean;
  defaultHourlyRate?: number;
  currency: string;
  locale: string;
  weekStart: 0 | 1;
  roundTo: 0 | 1 | 5 | 15 | 30;
  invoiceProfile?: InvoiceProfile;
  lastBackupAt?: number;
  features: FeatureFlags;
  targetHoursPerWeek?: number;
}

export interface StoredInvoiceLineItem {
  description: string;
  date?: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface StoredInvoice {
  id: string;
  number?: string;
  date: number;
  recipient: { name: string; address?: string };
  issuer: InvoiceProfile;
  projectId?: string;
  projectName?: string;
  range: { from: number; to: number };
  currency: string;
  lineItems: StoredInvoiceLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount: number;
  total: number;
  createdAt: number;
}

export interface DBSnapshot {
  schemaVersion: number;
  exportedAt: number;
  app: "zeiterfassung";
  projects: Project[];
  tags: Tag[];
  timeEntries: TimeEntry[];
  settings: Settings;
  invoices?: StoredInvoice[];
  breaks?: Break[];
}
