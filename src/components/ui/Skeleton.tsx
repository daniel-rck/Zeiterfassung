export function Skeleton({
  className = '',
  w,
  h,
  rounded = 'md',
}: {
  className?: string
  w?: string | number
  h?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}) {
  const r =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'lg'
        ? 'rounded-lg'
        : rounded === 'sm'
          ? 'rounded-sm'
          : 'rounded-md'
  return (
    <span
      aria-hidden="true"
      className={`skeleton inline-block ${r} ${className}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
      }}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          h={12}
          w={i === lines - 1 ? '60%' : '100%'}
          className="block"
        />
      ))}
    </div>
  )
}
