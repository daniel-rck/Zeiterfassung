import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Clock,
  ListChecks,
  FolderKanban,
  Tags,
  BarChart3,
  FileText,
  Archive as ArchiveIcon,
  CalendarDays,
  Plus,
  Sun,
  Moon,
  Laptop,
  Download,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFeatures } from '../lib/hooks/useFeature'
import { useRunningEntry } from '../lib/hooks/useRunningEntry'
import { useTheme } from '../lib/hooks/useTheme'
import { useToast } from './ui/Toast'
import {
  getRunningEntry,
  startTimer,
  stopTimer,
} from '../lib/db/timeEntries'
import { downloadSnapshot } from '../lib/io/exportJson'
import type { FeatureName } from '../lib/types'
import { Sidebar, type SidebarNavItem } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileBottomNav, type MobileNavItem } from './MobileBottomNav'
import { CommandPalette, type CommandItem } from './ui/CommandPalette'
import { modKey } from '../lib/platform'

interface NavConfig {
  to: string
  label: string
  icon: SidebarNavItem['icon']
  feature?: FeatureName
  end?: boolean
}

const NAV: NavConfig[] = [
  { to: '/', label: 'Heute', icon: Clock, end: true },
  { to: '/entries', label: 'Einträge', icon: ListChecks },
  { to: '/week', label: 'Woche', icon: CalendarDays, feature: 'weeklyView' },
  { to: '/projects', label: 'Projekte', icon: FolderKanban, feature: 'projects' },
  { to: '/tags', label: 'Tags', icon: Tags, feature: 'tags' },
  { to: '/reports', label: 'Reports', icon: BarChart3, feature: 'reports' },
  { to: '/invoice', label: 'Rechnung', icon: FileText, feature: 'invoicing' },
  { to: '/invoices', label: 'Archiv', icon: ArchiveIcon, feature: 'invoicing' },
]

const PRIMARY_MOBILE = ['/', '/entries', '/reports', '/settings']

export function AppShell() {
  const features = useFeatures()
  const location = useLocation()
  const navigate = useNavigate()
  const { entry } = useRunningEntry()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [commandOpen, setCommandOpen] = useState(false)

  const visible: NavConfig[] = NAV.filter(
    (item) => !item.feature || features[item.feature],
  )

  const sidebarItems: SidebarNavItem[] = visible.map((item) => ({
    to: item.to,
    label: item.label,
    icon: item.icon,
    end: item.end,
  }))

  const primaryMobile: MobileNavItem[] = visible.filter((i) =>
    PRIMARY_MOBILE.includes(i.to),
  )
  const overflow: MobileNavItem[] = visible.filter(
    (i) => !PRIMARY_MOBILE.includes(i.to),
  )

  // ⌘K / Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: 'toggle-timer',
        section: 'Aktionen',
        label: entry ? 'Timer stoppen' : 'Timer starten',
        description: entry ? 'Aktiven Timer beenden' : 'Neuen Timer beginnen',
        icon: <Clock size={14} />,
        kbd: 'Space',
        keywords: ['start', 'stop', 'timer', 'play'],
        onSelect: async () => {
          try {
            const running = await getRunningEntry()
            if (running) {
              await stopTimer()
              toast.success('Timer gestoppt')
            } else {
              await startTimer({})
              toast.success('Timer gestartet')
            }
          } catch (err) {
            toast.error((err as Error).message)
          }
        },
      },
      {
        id: 'new-entry',
        section: 'Aktionen',
        label: 'Neuen Eintrag erfassen',
        description: 'Manuellen Zeit-Eintrag anlegen',
        icon: <Plus size={14} />,
        kbd: 'N',
        keywords: ['neu', 'add', 'create'],
        onSelect: () => navigate('/entry/new'),
      },
      {
        id: 'backup',
        section: 'Aktionen',
        label: 'Backup herunterladen',
        description: 'JSON-Snapshot exportieren',
        icon: <Download size={14} />,
        keywords: ['export', 'sichern', 'json'],
        onSelect: async () => {
          try {
            await downloadSnapshot()
            toast.success('Backup heruntergeladen')
          } catch (err) {
            toast.error((err as Error).message)
          }
        },
      },
    ]

    visible.forEach((item) => {
      list.push({
        id: `nav-${item.to}`,
        section: 'Navigation',
        label: item.label,
        description: `Zu ${item.label} wechseln`,
        icon: <item.icon size={14} />,
        keywords: [item.label.toLowerCase(), item.to],
        onSelect: () => navigate(item.to),
      })
    })
    list.push({
      id: 'nav-settings',
      section: 'Navigation',
      label: 'Einstellungen',
      icon: <Sun size={14} />,
      keywords: ['settings', 'config'],
      onSelect: () => navigate('/settings'),
    })

    list.push(
      {
        id: 'theme-light',
        section: 'Erscheinung',
        label: 'Hell',
        icon: <Sun size={14} />,
        hint: theme === 'light' ? 'Aktiv' : undefined,
        keywords: ['light', 'theme'],
        onSelect: () => setTheme('light'),
      },
      {
        id: 'theme-dark',
        section: 'Erscheinung',
        label: 'Dunkel',
        icon: <Moon size={14} />,
        hint: theme === 'dark' ? 'Aktiv' : undefined,
        keywords: ['dark', 'theme'],
        onSelect: () => setTheme('dark'),
      },
      {
        id: 'theme-system',
        section: 'Erscheinung',
        label: 'System',
        icon: <Laptop size={14} />,
        hint: theme === 'system' ? 'Aktiv' : undefined,
        keywords: ['system', 'theme', 'auto'],
        onSelect: () => setTheme('system'),
      },
    )

    return list
  }, [entry, visible, theme, navigate, setTheme, toast])

  const showFab = !entry && location.pathname !== '/entry/new'

  return (
    <div className="flex h-screen w-full bg-[color:var(--color-surface-0)]">
      <Sidebar items={sidebarItems} onOpenCommand={() => setCommandOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenCommand={() => setCommandOpen(true)} />
        <main
          id="main"
          key={location.pathname}
          className="page-fade flex-1 overflow-y-auto pb-24 md:pb-8"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
        <footer className="hidden border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-6 py-3 text-center text-xs text-[color:var(--color-text-3)] md:block">
          <span>
            Lokal im Browser · Kein Account · Open Source ·{' '}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="underline-offset-2 hover:underline"
            >
              {modKey()} K für Befehle
            </button>
          </span>
        </footer>
      </div>

      <MobileBottomNav
        primary={primaryMobile}
        overflow={overflow}
        showFab={showFab}
      />

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        commands={commands}
      />
    </div>
  )
}
