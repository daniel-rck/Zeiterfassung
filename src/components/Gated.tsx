import type { ReactNode } from 'react'
import type { DetailLevel } from '../lib/types'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'

export function Gated({
  level,
  fallback = null,
  children,
}: {
  level: DetailLevel
  fallback?: ReactNode
  children: ReactNode
}) {
  const { atLeast } = useDetailLevel()
  if (!atLeast(level)) return <>{fallback}</>
  return <>{children}</>
}
