import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { patchSettings } from '../db/settings'
import { useSettings } from './useSettings'

interface ThemeContextValue {
  theme: 'system' | 'light' | 'dark'
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: 'system' | 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolve(theme: 'system' | 'light' | 'dark'): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const theme = settings.theme

  const resolvedTheme = useMemo(() => resolve(theme), [theme])

  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const root = document.documentElement
      if (mq.matches) root.classList.add('dark')
      else root.classList.remove('dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next) => {
        patchSettings({ theme: next })
      },
    }),
    [theme, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
