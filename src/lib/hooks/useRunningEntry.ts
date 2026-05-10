import { useCallback, useEffect, useState } from 'react'
import type { TimeEntry } from '../types'
import { getRunningEntry } from '../db/timeEntries'
import { subscribe } from '../db/broadcast'

export function useRunningEntry(): {
  entry: TimeEntry | null
  liveDurationSec: number
  loading: boolean
  reload: () => Promise<void>
} {
  const [entry, setEntry] = useState<TimeEntry | null>(null)
  const [liveDurationSec, setLiveDurationSec] = useState(0)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const data = await getRunningEntry()
      setEntry(data ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'timer-started' ||
        message.type === 'timer-stopped' ||
        message.type === 'entry-changed' ||
        message.type === 'entry-deleted' ||
        message.type === 'db-cleared'
      ) {
        void reload()
      }
    })
    return unsubscribe
  }, [reload])

  useEffect(() => {
    if (!entry) {
      setLiveDurationSec(0)
      return
    }
    const update = () => {
      setLiveDurationSec(Math.max(0, Math.round((Date.now() - entry.startedAt) / 1000)))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [entry])

  return { entry, liveDurationSec, loading, reload }
}
