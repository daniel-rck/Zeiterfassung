import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { newId } from '../../lib/ids'

type Tone = 'info' | 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastOptions {
  tone?: Tone
  duration?: number
  action?: ToastAction
}

interface ToastItem {
  id: string
  message: string
  tone: Tone
  duration: number
  action?: ToastAction
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void
  success: (message: string, options?: Omit<ToastOptions, 'tone'>) => void
  error: (message: string, options?: Omit<ToastOptions, 'tone'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION: Record<Tone, number> = {
  info: 3500,
  success: 3500,
  error: 6000,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id))
  }, [])

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = newId()
      const tone: Tone = options.tone ?? 'info'
      const duration = options.duration ?? DEFAULT_DURATION[tone]
      setItems((current) => [
        ...current,
        { id, message, tone, duration, action: options.action },
      ])
    },
    [],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m, o) => show(m, { ...o, tone: 'success' }),
      error: (m, o) => show(m, { ...o, tone: 'error' }),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Benachrichtigungen"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {items.map((item) => (
          <ToastEntry key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastEntry({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  const startedAt = useRef(Date.now())
  const remaining = useRef(item.duration)

  useEffect(() => {
    if (paused) {
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current))
      return
    }
    startedAt.current = Date.now()
    const timer = setTimeout(onDismiss, remaining.current)
    return () => clearTimeout(timer)
  }, [paused, onDismiss])

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-2 text-sm shadow-lg ${
        item.tone === 'success'
          ? 'bg-green-600 text-white'
          : item.tone === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
      }`}
      role={item.tone === 'error' ? 'alert' : 'status'}
      aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span>{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick()
            onDismiss()
          }}
          className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide hover:bg-white/30"
        >
          {item.action.label}
        </button>
      )}
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
