import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'

const FIELD_BASE =
  'w-full rounded-md border bg-[color:var(--color-surface-1)] px-3 py-2 text-sm text-[color:var(--color-text-1)] placeholder:text-[color:var(--color-text-3)] outline-none transition-colors duration-150 ease-out disabled:opacity-60 disabled:cursor-not-allowed'

const FIELD_DEFAULT =
  'border-[color:var(--color-border-strong)] hover:border-[color:var(--color-text-3)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25'

const FIELD_ERROR =
  'border-[color:var(--color-danger-500)] focus:ring-2 focus:ring-[color:var(--color-danger-500)]/25'

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  required,
}: {
  label?: string
  hint?: string
  error?: string | null
  children: ReactNode
  htmlFor?: string
  required?: boolean
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-2)]">
          {label}
          {required && (
            <span className="ml-0.5 text-[color:var(--color-danger-500)]">*</span>
          )}
        </span>
      )}
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-xs text-[color:var(--color-text-3)]">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs text-[color:var(--color-danger-500)]">
          {error}
        </span>
      )}
    </label>
  )
}

type InputBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'prefix' | 'suffix'
>

interface InputExtra {
  error?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function Input({
  error,
  leadingIcon,
  trailingIcon,
  className = '',
  ...props
}: InputBaseProps & InputExtra) {
  const fieldClass = `${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_DEFAULT} ${leadingIcon ? 'pl-9' : ''} ${trailingIcon ? 'pr-9' : ''}`
  if (!leadingIcon && !trailingIcon) {
    return (
      <input
        {...props}
        aria-invalid={error || undefined}
        className={`${fieldClass} ${className}`}
      />
    )
  }
  return (
    <span className={`relative inline-flex w-full ${className}`}>
      {leadingIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[color:var(--color-text-3)]">
          {leadingIcon}
        </span>
      )}
      <input
        {...props}
        aria-invalid={error || undefined}
        className={fieldClass}
      />
      {trailingIcon && (
        <span className="absolute inset-y-0 right-3 z-10 flex items-center text-[color:var(--color-text-3)]">
          {trailingIcon}
        </span>
      )}
    </span>
  )
}

export function Textarea({
  error,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={error || undefined}
      className={`${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_DEFAULT} min-h-20 resize-y ${className}`}
    />
  )
}

export function Select({
  error,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={error || undefined}
      className={`${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_DEFAULT} pr-8 ${className}`}
    />
  )
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm select-none">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[color:var(--color-border-strong)] text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span>
        <span className="text-[color:var(--color-text-1)]">{label}</span>
        {hint && (
          <span className="block text-xs text-[color:var(--color-text-3)]">
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}
