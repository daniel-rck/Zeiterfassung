import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { newId } from '../../lib/ids'

type Tone = 'info' | 'success' | 'error'

interface ToastItem {
  id: string
  message: string
  tone: Tone
}

interface ToastContextValue {
  show: (message: string, tone?: Tone) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: Tone = 'info') => {
      const id = newId()
      setItems((current) => [...current, { id, message, tone }])
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-lg ${
              item.tone === 'success'
                ? 'bg-green-600 text-white'
                : item.tone === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            }`}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
