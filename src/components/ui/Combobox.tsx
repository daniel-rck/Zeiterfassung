import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

export interface ComboOption {
  value: string
  label: string
  hint?: string
  color?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Auswählen…',
  clearLabel = 'Ohne',
  allowClear = true,
  ariaLabel,
  variant = 'default',
  size = 'md',
  block = true,
  leadingIcon,
}: {
  options: ComboOption[]
  value: string | undefined
  onChange: (next: string | undefined) => void
  placeholder?: string
  clearLabel?: string
  allowClear?: boolean
  ariaLabel?: string
  variant?: 'default' | 'ghost'
  size?: 'sm' | 'md'
  block?: boolean
  leadingIcon?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint && o.hint.toLowerCase().includes(q)),
    )
  }, [options, query])

  // Reset the highlight to the first match whenever the query narrows the
  // list, so the highlighted index can never point past the end of `filtered`
  // (which would make Enter select nothing).
  useEffect(() => {
    setHighlight(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    setHighlight(0)
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = options.find((o) => o.value === value)

  const triggerHeight = size === 'sm' ? 'h-8' : 'h-9'
  const triggerBase =
    'group inline-flex w-full items-center gap-2 rounded-md px-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none'
  const triggerVariant =
    variant === 'ghost'
      ? 'bg-transparent text-[color:var(--color-text-1)] hover:bg-[color:var(--color-surface-2)]'
      : 'border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-1)] hover:border-[color:var(--color-text-3)]'

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) {
        onChange(opt.value)
        setOpen(false)
        setQuery('')
      }
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`relative ${block ? 'w-full' : 'inline-block'}`}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`${triggerBase} ${triggerVariant} ${triggerHeight} ${block ? 'w-full' : ''}`}
      >
        {leadingIcon}
        {selected?.color && (
          <span
            aria-hidden="true"
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: selected.color }}
          />
        )}
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? '' : 'text-[color:var(--color-text-3)]'
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        {selected?.hint && (
          <span className="hidden text-xs text-[color:var(--color-text-3)] sm:inline">
            {selected.hint}
          </span>
        )}
        <ChevronDown
          size={14}
          className="flex-shrink-0 text-[color:var(--color-text-3)]"
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="page-fade absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] shadow-md"
        >
          <div className="border-b border-[color:var(--color-border-subtle)] px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Suchen…"
              className="w-full bg-transparent text-sm text-[color:var(--color-text-1)] placeholder:text-[color:var(--color-text-3)] focus:outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {allowClear && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => {
                    onChange(undefined)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[color:var(--color-text-2)] transition-colors hover:bg-[color:var(--color-surface-2)] no-min-tap"
                >
                  <X size={12} className="text-[color:var(--color-text-3)]" />
                  <span className="flex-1">{clearLabel}</span>
                  {!value && (
                    <Check size={14} className="text-brand-500" />
                  )}
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-[color:var(--color-text-3)]">
                Keine Treffer
              </li>
            )}
            {filtered.map((opt, i) => {
              const active = opt.value === value
              const highlighted = i === highlight
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors no-min-tap ${
                      highlighted
                        ? 'bg-[color:var(--color-surface-2)]'
                        : ''
                    }`}
                  >
                    {opt.color && (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[color:var(--color-text-1)]">
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="text-xs text-[color:var(--color-text-3)]">
                        {opt.hint}
                      </span>
                    )}
                    {active && (
                      <Check size={14} className="text-brand-500" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
