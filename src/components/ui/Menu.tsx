import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

export function Menu({
  trigger,
  children,
  align = 'right',
}: {
  trigger: (props: {
    onClick: () => void
    'aria-expanded': boolean
    'aria-haspopup': 'menu'
  }) => ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative inline-block">
      {trigger({
        onClick: () => setOpen((v) => !v),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}
      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-1 min-w-[12rem] overflow-hidden rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] shadow-md ${align === 'right' ? 'right-0' : 'left-0'}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  onClick,
  icon,
  kbd,
  tone = 'default',
  children,
  disabled,
}: {
  onClick: () => void
  icon?: ReactNode
  kbd?: string
  tone?: 'default' | 'danger'
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors duration-100 no-min-tap ${
        tone === 'danger'
          ? 'text-[color:var(--color-danger-600)] hover:bg-[color:var(--color-danger-500)]/10 dark:text-[color:var(--color-danger-500)]'
          : 'text-[color:var(--color-text-1)] hover:bg-[color:var(--color-surface-2)]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon && (
        <span className="flex-shrink-0 text-[color:var(--color-text-3)]">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {kbd && <span className="kbd">{kbd}</span>}
    </button>
  )
}

export function MenuSeparator() {
  return (
    <div
      role="separator"
      className="my-1 h-px bg-[color:var(--color-border-subtle)]"
    />
  )
}
