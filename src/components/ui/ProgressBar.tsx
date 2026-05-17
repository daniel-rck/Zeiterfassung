export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  tone = 'brand',
  label,
}: {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  tone?: 'brand' | 'success' | 'warn' | 'danger'
  label?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const h = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-1.5'
  const bar =
    tone === 'success'
      ? 'bg-[color:var(--color-success-500)]'
      : tone === 'warn'
        ? 'bg-[color:var(--color-warn-500)]'
        : tone === 'danger'
          ? 'bg-[color:var(--color-danger-500)]'
          : 'bg-brand-500'
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`relative w-full overflow-hidden rounded-full bg-[color:var(--color-surface-3)] ${h}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-out ${bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
