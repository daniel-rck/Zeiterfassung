import { useCallback, useEffect, useState } from 'react'
import type { Settings } from '../types'
import { readSettings } from '../db/settings'
import { subscribe } from '../db/broadcast'

export function useSettings(): {
  settings: Settings
  reload: () => void
} {
  const [settings, setSettings] = useState<Settings>(() => readSettings())

  const reload = useCallback(() => {
    setSettings(readSettings())
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === 'settings-changed' || message.type === 'db-cleared') {
        reload()
      }
    })
    return unsubscribe
  }, [reload])

  return { settings, reload }
}
