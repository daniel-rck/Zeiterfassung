import { Link, NavLink } from 'react-router-dom'
import { Search, Settings as SettingsIcon, Sun, Moon, Laptop } from 'lucide-react'
import type { ComponentType } from 'react'
import { Kbd } from './ui/Kbd'
import { modKey } from '../lib/platform'
import { useTheme } from '../lib/hooks/useTheme'

export interface SidebarNavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  end?: boolean
  kbd?: string
}

export function Sidebar({
  items,
  onOpenCommand,
}: {
  items: SidebarNavItem[]
  onOpenCommand: () => void
}) {
  return (
    <aside
      aria-label="Hauptnavigation"
      className="hidden h-screen w-60 flex-col border-r border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] md:flex"
    >
      <div className="flex h-14 items-center px-4">
        <Link to="/" className="flex items-center gap-2 no-min-tap">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.75 3.5v3.69l2.78 1.65-.75 1.27L7.25 9V4.5h1.5Z" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Zeiterfassung
          </span>
        </Link>
      </div>

      <div className="px-2">
        <button
          type="button"
          onClick={onOpenCommand}
          className="group flex w-full items-center gap-2 rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)] px-2.5 py-1.5 text-left text-xs text-[color:var(--color-text-3)] transition-colors hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-2)] no-min-tap"
        >
          <Search size={13} />
          <span className="flex-1">Suchen oder Aktion…</span>
          <Kbd>{modKey()} K</Kbd>
        </button>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-2">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150 no-min-tap ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'text-[color:var(--color-text-2)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)]'
                    }`
                  }
                >
                  <Icon size={15} />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.label}
                  </span>
                  {item.kbd && (
                    <span className="kbd opacity-0 transition-opacity group-hover:opacity-100">
                      {item.kbd}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-[color:var(--color-border-subtle)] p-2">
        <SidebarThemeToggle />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `mt-1 flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150 no-min-tap ${
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                : 'text-[color:var(--color-text-2)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)]'
            }`
          }
        >
          <SettingsIcon size={15} />
          <span className="font-medium">Einstellungen</span>
        </NavLink>
      </div>
    </aside>
  )
}

function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: 'light' as const, label: 'Hell', Icon: Sun },
    { value: 'dark' as const, label: 'Dunkel', Icon: Moon },
    { value: 'system' as const, label: 'System', Icon: Laptop },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Erscheinungsbild"
      className="inline-flex items-center gap-0.5 rounded-md bg-[color:var(--color-surface-2)] p-0.5 ring-1 ring-inset ring-[color:var(--color-border-subtle)]"
    >
      {options.map((opt) => {
        const Icon = opt.Icon
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => setTheme(opt.value)}
            className={`no-min-tap inline-flex h-6 w-6 items-center justify-center rounded transition-colors ${
              active
                ? 'bg-[color:var(--color-surface-1)] text-[color:var(--color-text-1)] shadow-xs'
                : 'text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)]'
            }`}
          >
            <Icon size={13} />
          </button>
        )
      })}
    </div>
  )
}
