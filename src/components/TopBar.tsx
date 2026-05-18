import { Link, useLocation } from 'react-router-dom'
import { Search, Clock } from 'lucide-react'
import { useRunningEntry } from '../lib/hooks/useRunningEntry'
import { formatDuration } from '../lib/format'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Heute',
  '/entries': 'Einträge',
  '/week': 'Woche',
  '/projects': 'Projekte',
  '/tags': 'Tags',
  '/reports': 'Reports',
  '/invoice': 'Rechnung',
  '/invoices': 'Archiv',
  '/settings': 'Einstellungen',
  '/entry/new': 'Neuer Eintrag',
}

export function TopBar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const location = useLocation()
  const { entry, liveDurationSec } = useRunningEntry()

  let title = ROUTE_TITLES[location.pathname] ?? ''
  if (!title && location.pathname.startsWith('/entry/')) {
    title = 'Eintrag bearbeiten'
  }
  const showPill = entry && location.pathname !== '/'

  return (
    <header className="sticky top-0 z-10 flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-0)]/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to="/"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white md:hidden no-min-tap"
          aria-label="Zur Startseite"
        >
          <Clock size={14} />
        </Link>
        <h1 className="truncate text-sm font-semibold text-[color:var(--color-text-1)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {showPill && entry && (
          <Link
            to="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand-500 px-2.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 no-min-tap"
          >
            <span
              aria-hidden="true"
              className="pulse-dot h-1.5 w-1.5 rounded-full bg-white"
            />
            <span className="tnum font-mono">
              {formatDuration(liveDurationSec, 'short')}
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Befehlsmenü öffnen"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-2)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)] md:hidden no-min-tap"
        >
          <Search size={15} />
        </button>
      </div>
    </header>
  )
}
