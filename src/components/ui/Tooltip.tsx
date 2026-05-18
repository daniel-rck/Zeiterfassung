import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const id = useId()
  const positionClass =
    side === 'top'
      ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
      : side === 'bottom'
        ? 'top-full left-1/2 mt-2 -translate-x-1/2'
        : side === 'left'
          ? 'right-full top-1/2 mr-2 -translate-y-1/2'
          : 'left-full top-1/2 ml-2 -translate-y-1/2'

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': id,
      })
    : children

  return (
    <span className="group relative inline-flex">
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-2 py-1 text-xs text-[color:var(--color-text-1)] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${positionClass}`}
      >
        {content}
      </span>
    </span>
  )
}
