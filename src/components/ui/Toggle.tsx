import type { ReactNode } from 'react'

export function Switch({
  checked,
  onChange,
  disabled,
  ariaLabel,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  ariaLabel?: string
  id?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`no-min-tap relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-surface-1)] ${
        checked
          ? 'bg-brand-500'
          : 'bg-[color:var(--color-surface-3)] ring-1 ring-inset ring-[color:var(--color-border-subtle)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
  id?: string
}) {
  return (
    <div
      role="group"
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center gap-3 rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-3 transition-colors duration-150 hover:border-[color:var(--color-border-strong)] ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      {icon && (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[color:var(--color-surface-2)] text-[color:var(--color-text-2)]">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[color:var(--color-text-1)]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-[color:var(--color-text-3)]">
            {description}
          </span>
        )}
      </span>
      <span onClick={(e) => e.stopPropagation()}>
        <Switch
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          ariaLabel={label}
        />
      </span>
    </div>
  )
}
