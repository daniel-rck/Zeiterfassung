import type { ReactNode } from 'react'

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
    <label
      htmlFor={id}
      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      {icon && (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
        )}
      </span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`no-min-tap relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}
