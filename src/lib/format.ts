export function formatDuration(seconds: number, mode: 'short' | 'long' = 'short'): string {
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (mode === 'long') {
    if (h === 0 && m === 0 && s === 0) return '0 min'
    if (h === 0 && m === 0) return `${s}s`
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// Locale-aware decimal hours (e.g. "1,50" in de-DE, "1.50" in en-US).
// Defaults to en-US so backwards-compatible call sites without a locale
// continue to receive a dot separator.
export function formatDecimalHours(
  seconds: number,
  localeOrDigits?: string | number,
  fractionDigits = 2,
): string {
  const locale = typeof localeOrDigits === 'string' ? localeOrDigits : 'en-US'
  const digits = typeof localeOrDigits === 'number' ? localeOrDigits : fractionDigits
  const hours = seconds / 3600
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(hours)
  } catch {
    return hours.toFixed(digits)
  }
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp)
}

export function formatTime(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export function formatDateTime(timestamp: number, locale: string): string {
  return `${formatDate(timestamp, locale)} ${formatTime(timestamp, locale)}`
}

export function formatRelativeDay(timestamp: number, locale: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Heute'
  if (diffDays === -1) return 'Gestern'
  if (diffDays === 1) return 'Morgen'
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp)
}
