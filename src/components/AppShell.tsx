import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Clock, ListChecks, FolderKanban, Tags, BarChart3, FileText, Settings as SettingsIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'
import { useRunningEntry } from '../lib/hooks/useRunningEntry'
import { formatDuration } from '../lib/format'
import type { DetailLevel } from '../lib/types'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  level?: DetailLevel
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Heute', icon: Clock, end: true },
  { to: '/entries', label: 'Einträge', icon: ListChecks },
  { to: '/projects', label: 'Projekte', icon: FolderKanban, level: 'standard' },
  { to: '/tags', label: 'Tags', icon: Tags, level: 'pro' },
  { to: '/reports', label: 'Reports', icon: BarChart3, level: 'standard' },
  { to: '/invoice', label: 'Rechnung', icon: FileText, level: 'proplus' },
  { to: '/settings', label: 'Einstellungen', icon: SettingsIcon },
]

export function AppShell() {
  const { atLeast } = useDetailLevel()
  const { entry, liveDurationSec } = useRunningEntry()
  const location = useLocation()
  const visible = NAV.filter((item) => !item.level || atLeast(item.level))
  const showRunningPill = entry && location.pathname !== '/'

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 no-min-tap">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Clock size={18} />
            </span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Zeiterfassung
            </span>
          </Link>
          {showRunningPill && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-brand-700 no-min-tap"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="font-mono tabular-nums">
                {formatDuration(liveDurationSec, 'short')}
              </span>
              <span className="hidden sm:inline">läuft</span>
            </Link>
          )}
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2 text-sm">
          {visible.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors no-min-tap ${
                    isActive
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 pb-6 text-center text-xs text-zinc-400">
        Lokal im Browser · Kein Account · Open Source
      </footer>
    </div>
  )
}
