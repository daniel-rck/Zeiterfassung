import type { ReactNode } from 'react'

export interface TabItem<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
  hint?: ReactNode
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  orientation = 'horizontal',
  ariaLabel,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (next: T) => void
  orientation?: 'horizontal' | 'vertical'
  ariaLabel?: string
}) {
  if (orientation === 'vertical') {
    return (
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label={ariaLabel}
        className="flex flex-col gap-0.5"
      >
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-150 no-min-tap ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'text-[color:var(--color-text-2)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)]'
              }`}
            >
              {item.icon && (
                <span className="flex-shrink-0">{item.icon}</span>
              )}
              <span className="min-w-0 flex-1 truncate font-medium">
                {item.label}
              </span>
              {item.hint && (
                <span className="flex-shrink-0 text-xs text-[color:var(--color-text-3)]">
                  {item.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex border-b border-[color:var(--color-border-subtle)]"
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`relative -mb-px inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              active
                ? 'border-b-2 border-brand-500 text-[color:var(--color-text-1)]'
                : 'border-b-2 border-transparent text-[color:var(--color-text-2)] hover:text-[color:var(--color-text-1)]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
