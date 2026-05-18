import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve })
    })
  }, [])

  const close = useCallback(
    (result: boolean) => {
      pending?.resolve(result)
      setPending(null)
    },
    [pending],
  )

  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [pending, close])

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div className="page-fade relative z-10 w-full max-w-md rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5 shadow-md">
            <div className="flex items-start gap-3">
              {pending.options.tone === 'danger' && (
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-danger-500)]/10 text-[color:var(--color-danger-500)]">
                  <AlertTriangle size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-title"
                  className="text-sm font-semibold text-[color:var(--color-text-1)]"
                >
                  {pending.options.title}
                </h2>
                {pending.options.description && (
                  <div className="mt-1.5 text-sm text-[color:var(--color-text-2)]">
                    {pending.options.description}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => close(false)}>
                {pending.options.cancelLabel ?? 'Abbrechen'}
              </Button>
              <Button
                autoFocus
                variant={pending.options.tone === 'danger' ? 'danger' : 'primary'}
                onClick={() => close(true)}
              >
                {pending.options.confirmLabel ?? 'Bestätigen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
