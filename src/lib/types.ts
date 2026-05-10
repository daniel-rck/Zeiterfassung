export type DetailLevel = 'basis' | 'standard' | 'pro' | 'proplus'

export const DETAIL_LEVEL_ORDER: Record<DetailLevel, number> = {
  basis: 0,
  standard: 1,
  pro: 2,
  proplus: 3,
}

export interface Project {
  id: string
  name: string
  client?: string
  color: string
  hourlyRate?: number
  currency?: string
  billableDefault: boolean
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface TimeEntry {
  id: string
  projectId?: string
  description: string
  startedAt: number
  endedAt?: number
  durationSec: number
  billable: boolean
  tagIds: string[]
  notes?: string
  hourlyRateSnapshot?: number
  currencySnapshot?: string
  createdAt: number
  updatedAt: number
}

export interface InvoiceProfile {
  issuerName?: string
  issuerAddress?: string
  taxRate?: number
  taxId?: string
  nextInvoiceNumber?: number
}

export interface Settings {
  detailLevel: DetailLevel
  onboardingCompleted: boolean
  defaultBillable: boolean
  defaultHourlyRate?: number
  currency: string
  locale: string
  weekStart: 0 | 1
  theme: 'system' | 'light' | 'dark'
  roundTo: 0 | 1 | 5 | 15 | 30
  invoiceProfile?: InvoiceProfile
  lastBackupAt?: number
}

export interface DBSnapshot {
  schemaVersion: number
  exportedAt: number
  app: 'zeiterfassung'
  projects: Project[]
  tags: Tag[]
  timeEntries: TimeEntry[]
  settings: Settings
}
