import { useCallback } from 'react'
import { DETAIL_LEVEL_ORDER, type DetailLevel } from '../types'
import { useSettings } from './useSettings'

export function useDetailLevel(): {
  level: DetailLevel
  atLeast: (required: DetailLevel) => boolean
} {
  const { settings } = useSettings()
  const level = settings.detailLevel
  const atLeast = useCallback(
    (required: DetailLevel) => DETAIL_LEVEL_ORDER[level] >= DETAIL_LEVEL_ORDER[required],
    [level],
  )
  return { level, atLeast }
}
