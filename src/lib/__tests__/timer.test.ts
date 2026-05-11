import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createEntry,
  deleteEntry,
  getRunningEntry,
  listEntries,
  startTimer,
  stopTimer,
  updateEntry,
} from '../db/timeEntries'
import { createProject } from '../db/projects'

describe('timer engine', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts a running entry when none exists', async () => {
    const entry = await startTimer({ description: 'Test' })
    expect(entry.endedAt).toBeUndefined()
    expect(entry.description).toBe('Test')
    const running = await getRunningEntry()
    expect(running?.id).toBe(entry.id)
  })

  it('refuses a second timer while one is running', async () => {
    await startTimer({ description: 'A' })
    await expect(startTimer({ description: 'B' })).rejects.toThrow(/läuft bereits/)
  })

  it('stops the running timer and computes duration', async () => {
    const t0 = new Date('2026-05-10T10:00:00Z').getTime()
    const t1 = new Date('2026-05-10T10:05:30Z').getTime()
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(t0)
    await startTimer({ description: 'X' })
    dateSpy.mockReturnValue(t1)
    const stopped = await stopTimer()
    expect(stopped?.durationSec).toBe(330)
    const running = await getRunningEntry()
    expect(running).toBeUndefined()
    dateSpy.mockRestore()
  })

  it('inherits billable + rate from project on start', async () => {
    const project = await createProject({
      name: 'Kunde A',
      color: '#000000',
      billableDefault: true,
      hourlyRate: 100,
      currency: 'EUR',
      archived: false,
    })
    const entry = await startTimer({ projectId: project.id })
    expect(entry.billable).toBe(true)
    expect(entry.hourlyRateSnapshot).toBe(100)
    expect(entry.currencySnapshot).toBe('EUR')
    await stopTimer()
  })

  it('creates a manual entry with explicit duration', async () => {
    const start = Date.now() - 2 * 3600_000
    const end = Date.now()
    const entry = await createEntry({
      description: 'Manuell',
      startedAt: start,
      endedAt: end,
      billable: false,
      tagIds: [],
    })
    expect(entry.durationSec).toBe(7200)
  })

  it('updates and deletes', async () => {
    const entry = await createEntry({
      description: 'old',
      startedAt: Date.now() - 60_000,
      endedAt: Date.now(),
      billable: false,
      tagIds: [],
    })
    await updateEntry(entry.id, { description: 'new' })
    const all = await listEntries()
    expect(all.find((e) => e.id === entry.id)?.description).toBe('new')
    await deleteEntry(entry.id)
    const after = await listEntries()
    expect(after.find((e) => e.id === entry.id)).toBeUndefined()
  })

  it('excludes the running entry by default and includes it on opt-in', async () => {
    await createEntry({
      description: 'finished',
      startedAt: Date.now() - 60_000,
      endedAt: Date.now() - 30_000,
      billable: false,
      tagIds: [],
    })
    await startTimer({ description: 'live' })

    const defaulted = await listEntries()
    expect(defaulted.some((e) => e.description === 'live')).toBe(false)
    expect(defaulted.some((e) => e.description === 'finished')).toBe(true)

    const withRunning = await listEntries({ includeRunning: true })
    expect(withRunning.some((e) => e.description === 'live')).toBe(true)
  })

  it('keeps entries spanning midnight in the next day range', async () => {
    const start = new Date('2026-05-10T23:00:00Z').getTime()
    const end = new Date('2026-05-11T01:00:00Z').getTime()
    await createEntry({
      description: 'cross',
      startedAt: start,
      endedAt: end,
      billable: false,
      tagIds: [],
    })
    const dayFrom = new Date('2026-05-11T00:00:00Z').getTime()
    const dayTo = new Date('2026-05-11T23:59:59Z').getTime()
    const range = await listEntries({ from: dayFrom, to: dayTo })
    expect(range.some((e) => e.description === 'cross')).toBe(true)
  })

  it('keeps a running entry inside an open range', async () => {
    const start = Date.now() - 3600_000
    vi.spyOn(Date, 'now').mockReturnValue(start)
    await startTimer({ description: 'running' })
    vi.restoreAllMocks()
    const range = await listEntries({
      from: start - 60_000,
      to: start + 7200_000,
      includeRunning: true,
    })
    expect(range.some((e) => e.description === 'running')).toBe(true)
  })
})
