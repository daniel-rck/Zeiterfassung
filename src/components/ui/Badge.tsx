import type { ReactNode } from 'react'

type Tone = 'default' | 'brand' | 'success' | 'warn' | 'danger' | 'info'
type Size = 'xs' | 'sm'

const TONE: Record<Tone, string> = {
  default:
    'bg-[color:var(--color-surface-2)] text-[color:var(--color-text-2)] ring-1 ring-inset ring-[color:var(--color-border-subtle)]',
  brand:
    'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800/40',
  success:
    'bg-[color:var(--color-success-500)]/10 text-[color:var(--color-success-600)] ring-1 ring-inset ring-[color:var(--color-success-500)]/20 dark:text-[color:var(--color-success-500)]',
  warn:
    'bg-[color:var(--color-warn-500)]/10 text-[color:var(--color-warn-600)] ring-1 ring-inset ring-[color:var(--color-warn-500)]/20 dark:text-[color:var(--color-warn-500)]',
  danger:
    'bg-[color:var(--color-danger-500)]/10 text-[color:var(--color-danger-600)] ring-1 ring-inset ring-[color:var(--color-danger-500)]/20 dark:text-[color:var(--color-danger-500)]',
  info: 'bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800/40',
}

const SIZE: Record<Size, string> = {
  xs: 'h-5 px-1.5 text-2xs gap-1',
  sm: 'h-6 px-2 text-xs gap-1.5',
}

export function Badge({
  tone = 'default',
  size = 'sm',
  dot,
  icon,
  children,
  className = '',
}: {
  tone?: Tone
  size?: Size
  dot?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${TONE[tone]} ${SIZE[size]} ${className}`}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            tone === 'success'
              ? 'bg-[color:var(--color-success-500)]'
              : tone === 'warn'
                ? 'bg-[color:var(--color-warn-500)]'
                : tone === 'danger'
                  ? 'bg-[color:var(--color-danger-500)]'
                  : tone === 'brand' || tone === 'info'
                    ? 'bg-brand-500'
                    : 'bg-[color:var(--color-text-3)]'
          }`}
        />
      )}
      {icon}
      {children}
    </span>
  )
}
