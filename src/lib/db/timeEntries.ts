import type { TimeEntry } from '../types'
import { newId } from '../ids'
import { getDB, dayKey, type StoredTimeEntry } from './index'
import { broadcast } from './broadcast'
import { getProject } from './projects'

export type NewTimeEntry = Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'durationSec'> & {
  durationSec?: number
}

function toStored(entry: TimeEntry): StoredTimeEntry {
  return {
    ...entry,
    startedAtDay: dayKey(entry.startedAt),
    running: entry.endedAt == null ? 1 : 0,
  }
}

function fromStored(stored: StoredTimeEntry): TimeEntry {
  // Strip derived fields
  const { startedAtDay: _d, running: _r, ...rest } = stored
  void _d
  void _r
  return rest
}

function calcDuration(startedAt: number, endedAt?: number, fallback = 0): number {
  if (endedAt == null) return fallback
  return Math.max(0, Math.round((endedAt - startedAt) / 1000))
}

export interface StartTimerInput {
  projectId?: string
  description?: string
  billable?: boolean
  tagIds?: string[]
  notes?: string
}

export async function startTimer(input: StartTimerInput = {}): Promise<TimeEntry> {
  const running = await getRunningEntry()
  if (running) {
    throw new Error('Es läuft bereits ein Timer.')
  }
  const now = Date.now()
  let billable = input.billable
  let hourlyRate: number | undefined
  let currency: string | undefined
  if (input.projectId) {
    const project = await getProject(input.projectId)
    if (project) {
      billable = billable ?? project.billableDefault
      hourlyRate = project.hourlyRate
      currency = project.currency
    }
  }
  const entry: TimeEntry = {
    id: newId(),
    projectId: input.projectId,
    description: input.description ?? '',
    startedAt: now,
    endedAt: undefined,
    durationSec: 0,
    billable: billable ?? false,
    tagIds: input.tagIds ?? [],
    notes: input.notes,
    hourlyRateSnapshot: hourlyRate,
    currencySnapshot: currency,
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDB()
  await db.add('time_entries', toStored(entry))
  broadcast({ type: 'timer-started', id: entry.id })
  return entry
}

export async function stopTimer(): Promise<TimeEntry | null> {
  const running = await getRunningEntry()
  if (!running) return null
  const now = Date.now()
  const updated: TimeEntry = {
    ...running,
    endedAt: now,
    durationSec: calcDuration(running.startedAt, now),
    updatedAt: now,
  }
  const db = await getDB()
  await db.put('time_entries', toStored(updated))
  broadcast({ type: 'timer-stopped', id: updated.id })
  return updated
}

export async function getRunningEntry(): Promise<TimeEntry | undefined> {
  const db = await getDB()
  const stored = await db.getFromIndex('time_entries', 'byRunning', 1)
  return stored ? fromStored(stored) : undefined
}

export async function createEntry(input: NewTimeEntry): Promise<TimeEntry> {
  const now = Date.now()
  const duration =
    input.durationSec ?? calcDuration(input.startedAt, input.endedAt, 0)
  const entry: TimeEntry = {
    ...input,
    id: newId(),
    durationSec: duration,
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDB()
  await db.add('time_entries', toStored(entry))
  broadcast({ type: 'entry-changed', id: entry.id })
  return entry
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>,
): Promise<TimeEntry> {
  const db = await getDB()
  const existing = await db.get('time_entries', id)
  if (!existing) throw new Error(`Eintrag ${id} nicht gefunden`)
  const merged: TimeEntry = {
    ...fromStored(existing),
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  if (patch.startedAt != null || patch.endedAt !== undefined || patch.durationSec == null) {
    merged.durationSec =
      patch.durationSec ?? calcDuration(merged.startedAt, merged.endedAt, merged.durationSec)
  }
  await db.put('time_entries', toStored(merged))
  broadcast({ type: 'entry-changed', id })
  return merged
}

export async function getEntry(id: string): Promise<TimeEntry | undefined> {
  const db = await getDB()
  const stored = await db.get('time_entries', id)
  return stored ? fromStored(stored) : undefined
}

export interface ListEntriesFilter {
  from?: number
  to?: number
  projectId?: string | null // null = ohne Projekt
  billable?: boolean
  tagIds?: string[]
  includeRunning?: boolean
}

export async function listEntries(filter: ListEntriesFilter = {}): Promise<TimeEntry[]> {
  const db = await getDB()
  const all = await db.getAll('time_entries')
  let result = all.map(fromStored)
  // Range filter: include entries whose interval overlaps [from, to].
  // For running entries (endedAt == null), treat "ended" as +Infinity so they
  // are kept as long as they started before `to`.
  if (filter.from != null) {
    result = result.filter((e) => (e.endedAt ?? Number.POSITIVE_INFINITY) >= filter.from!)
  }
  if (filter.to != null) {
    result = result.filter((e) => e.startedAt <= filter.to!)
  }
  if (filter.projectId === null) {
    result = result.filter((e) => !e.projectId)
  } else if (filter.projectId) {
    result = result.filter((e) => e.projectId === filter.projectId)
  }
  if (filter.billable != null) {
    result = result.filter((e) => e.billable === filter.billable)
  }
  if (filter.tagIds && filter.tagIds.length > 0) {
    const wanted = new Set(filter.tagIds)
    result = result.filter((e) => e.tagIds.some((t) => wanted.has(t)))
  }
  if (!filter.includeRunning) {
    result = result.filter((e) => e.endedAt != null)
  }
  return result.sort((a, b) => b.startedAt - a.startedAt)
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('time_entries', id)
  broadcast({ type: 'entry-deleted', id })
}

// Re-insert an entry snapshot under its original id. Used by undo-toasts.
export async function restoreEntry(entry: TimeEntry): Promise<TimeEntry> {
  const db = await getDB()
  await db.put('time_entries', toStored(entry))
  broadcast({ type: 'entry-changed', id: entry.id })
  return entry
}
