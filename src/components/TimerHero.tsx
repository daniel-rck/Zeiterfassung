import { useEffect, useMemo, useState } from 'react'
import { Play, Square, Coffee, PlayCircle } from 'lucide-react'
import { useRunningEntry } from '../lib/hooks/useRunningEntry'
import { useProjects } from '../lib/hooks/useProjects'
import { useBreaksForEntry } from '../lib/hooks/useBreaks'
import { useFeature } from '../lib/hooks/useFeature'
import { startTimer, stopTimer, updateEntry } from '../lib/db/timeEntries'
import { endRunningBreakFor, startBreak } from '../lib/db/breaks'
import { formatDuration } from '../lib/format'
import { Input } from './ui/Input'
import { useToast } from './ui/Toast'
import { Gated } from './Gated'

export function TimerHero() {
  const { entry, liveDurationSec } = useRunningEntry()
  const { projects } = useProjects()
  const toast = useToast()
  const breaksOn = useFeature('breaks')
  const { runningBreak, totalSec: breakTotalSec, liveBreakSec } = useBreaksForEntry(entry?.id)
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (entry) {
      setDescription(entry.description)
      setProjectId(entry.projectId)
    }
  }, [entry])

  const handleStart = async () => {
    try {
      await startTimer({
        description: description.trim(),
        projectId,
      })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleStop = async () => {
    try {
      if (entry) {
        await endRunningBreakFor(entry.id)
      }
      const stopped = await stopTimer()
      if (stopped) {
        toast.success(`Eintrag gestoppt: ${formatDuration(stopped.durationSec, 'long')}`)
      }
      setDescription('')
      setProjectId(undefined)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleToggleBreak = async () => {
    if (!entry) return
    try {
      if (runningBreak) {
        await endRunningBreakFor(entry.id)
        toast.success('Pause beendet')
      } else {
        await startBreak(entry.id)
        toast.success('Pause läuft')
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const persistDescription = async () => {
    if (!entry) return
    if (description === entry.description) return
    try {
      await updateEntry(entry.id, { description })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const persistProject = async (next: string | undefined) => {
    setProjectId(next)
    if (!entry) return
    try {
      await updateEntry(entry.id, { projectId: next })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // Announce the timer at minute granularity for screen readers without
  // spamming once per second.
  const liveMinutes = Math.floor(liveDurationSec / 60)
  const announcement = useMemo(() => {
    if (!entry) return ''
    const hours = Math.floor(liveMinutes / 60)
    const rem = liveMinutes % 60
    if (hours === 0 && liveMinutes === 0) return 'Timer läuft.'
    if (hours === 0) return `Timer läuft, ${liveMinutes} Minuten.`
    if (rem === 0) return `Timer läuft, ${hours} Stunden.`
    return `Timer läuft, ${hours} Stunden ${rem} Minuten.`
  }, [entry, liveMinutes])

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => (entry ? void handleStop() : void handleStart())}
          className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 no-min-tap ${
            entry
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-brand-600 hover:bg-brand-700'
          }`}
          aria-label={entry ? 'Timer stoppen' : 'Timer starten'}
        >
          {entry ? <Square size={32} fill="white" /> : <Play size={36} fill="white" />}
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-mono text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatDuration(entry ? liveDurationSec : 0, 'short')}
            </div>
            {entry && breaksOn && breakTotalSec > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Coffee size={12} />
                <span className="font-mono tabular-nums">
                  {formatDuration(breakTotalSec, 'short')}
                </span>
              </div>
            )}
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
            {runningBreak ? ` Pause läuft seit ${Math.floor(liveBreakSec / 60)} Minuten.` : ''}
          </div>
          {entry && breaksOn && (
            <button
              type="button"
              onClick={() => void handleToggleBreak()}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                runningBreak
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {runningBreak ? (
                <>
                  <PlayCircle size={16} />
                  <span>Weiter ({formatDuration(liveBreakSec, 'short')})</span>
                </>
              ) : (
                <>
                  <Coffee size={16} />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}
          <Input
            placeholder={entry ? 'Beschreibung…' : 'Was machst du gerade?'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void persistDescription()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !entry) {
                e.preventDefault()
                void handleStart()
              }
            }}
          />
          <Gated feature="projects">
            <select
              value={projectId ?? ''}
              onChange={(e) => void persistProject(e.target.value || undefined)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Ohne Projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.client ? ` · ${p.client}` : ''}
                </option>
              ))}
            </select>
          </Gated>
        </div>
      </div>
    </div>
  )
}
