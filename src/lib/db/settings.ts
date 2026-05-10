import type { DetailLevel, InvoiceProfile, Settings } from '../types'
import { broadcast } from './broadcast'

const KEY = 'zeiterfassung:settings'

export const DEFAULT_SETTINGS: Settings = {
  detailLevel: 'standard',
  onboardingCompleted: false,
  defaultBillable: false,
  currency: 'EUR',
  locale: 'de-DE',
  weekStart: 1,
  theme: 'system',
  roundTo: 0,
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readSettings(): Settings {
  const ls = safeStorage()
  if (!ls) return { ...DEFAULT_SETTINGS }
  const raw = ls.getItem(KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function writeSettings(settings: Settings): void {
  const ls = safeStorage()
  if (!ls) return
  ls.setItem(KEY, JSON.stringify(settings))
  broadcast({ type: 'settings-changed' })
}

export function patchSettings(patch: Partial<Settings>): Settings {
  const next = { ...readSettings(), ...patch }
  writeSettings(next)
  return next
}

export function setDetailLevel(level: DetailLevel): Settings {
  return patchSettings({ detailLevel: level })
}

export function setInvoiceProfile(profile: InvoiceProfile | undefined): Settings {
  return patchSettings({ invoiceProfile: profile })
}
