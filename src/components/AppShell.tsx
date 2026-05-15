import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Clock,
  ListChecks,
  FolderKanban,
  Tags,
  BarChart3,
  FileText,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
  CalendarDays,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import { useFeatures } from '../lib/hooks/useFeature'
import { useRunningEntry } from '../lib/hooks/useRunningEntry'
import { formatDuration } from '../lib/format'
import type { FeatureName } from '../lib/types'
import { Sheet } from './ui/Sheet'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  feature?: FeatureName
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Heute', icon: Clock, end: true },
  { to: '/entries', label: 'Einträge', icon: ListChecks },
  { to: '/week', label: 'Woche', icon: CalendarDays, feature: 'weeklyView' },
  { to: '/projects', label: 'Projekte', icon: FolderKanban, feature: 'projects' },
  { to: '/tags', label: 'Tags', icon: Tags, feature: 'tags' },
  { to: '/reports', label: 'Reports', icon: BarChart3, feature: 'reports' },
  { to: '/invoice', label: 'Rechnung', icon: FileText, feature: 'invoicing' },
  { to: '/invoices', label: 'Archiv', icon: ArchiveIcon, feature: 'invoicing' },
  { to: '/settings', label: 'Einstellungen', icon: SettingsIcon },
]

const PRIMARY_MOBILE_TABS = ['/', '/entries', '/reports', '/settings']

export function AppShell() {
  const features = useFeatures()
  const { entry, liveDurationSec } = useRunningEntry()
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const visible = NAV.filter((item) => !item.feature || features[item.feature])
  const showRunningPill = entry && location.pathname !== '/'

  const primaryMobile = visible.filter((item) => PRIMARY_MOBILE_TABS.includes(item.to))
  const overflow = visible.filter((item) => !PRIMARY_MOBILE_TABS.includes(item.to))

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  const handleFabClick = () => {
    navigate('/entry/new')
  }

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
        <nav className="mx-auto hidden max-w-5xl gap-1 overflow-x-auto px-2 pb-2 text-sm sm:flex">
          {visible.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-2 transition-colors ${
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

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-24 sm:pb-5">
        <Outlet />
      </main>

      <footer className="mx-auto hidden w-full max-w-5xl px-4 pb-6 text-center text-xs text-zinc-400 sm:block">
        Lokal im Browser · Kein Account · Open Source
      </footer>

      {!entry && location.pathname !== '/entry/new' && (
        <button
          type="button"
          onClick={handleFabClick}
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-white/40 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 sm:bottom-6 dark:ring-zinc-900/60"
          aria-label="Neuen Eintrag erfassen"
        >
          <Plus size={26} />
        </button>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Hauptnavigation"
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-1">
          {primaryMobile.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors no-min-tap ${
                    isActive
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                        isActive
                          ? 'bg-brand-100 dark:bg-brand-950/50'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-zinc-500 transition-colors no-min-tap dark:text-zinc-400"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full">
                <MoreHorizontal size={20} />
              </span>
              <span>Mehr</span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Mehr" size="sm">
        <ul className="grid grid-cols-2 gap-2">
          {overflow.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </div>
  )
}
