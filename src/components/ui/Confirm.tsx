import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Sheet } from './Sheet'
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

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Sheet
        open={!!pending}
        onClose={() => close(false)}
        title={pending?.options.title}
        size="sm"
      >
        {pending?.options.description && (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {pending.options.description}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            {pending?.options.cancelLabel ?? 'Abbrechen'}
          </Button>
          <Button
            variant={pending?.options.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => close(true)}
          >
            {pending?.options.confirmLabel ?? 'Bestätigen'}
          </Button>
        </div>
      </Sheet>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
