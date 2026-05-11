import { describe, expect, it } from 'vitest'
import { importSnapshot } from '../importJson'
import { listEntries } from '../../db/timeEntries'
import { listProjects } from '../../db/projects'

const VALID_SNAPSHOT = {
  app: 'zeiterfassung',
  schemaVersion: 1,
  exportedAt: 0,
  projects: [
    {
      id: 'p1',
      name: 'Projekt 1',
      color: '#000',
      billableDefault: false,
      archived: false,
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  tags: [],
  timeEntries: [
    {
      id: 'e1',
      description: 'test',
      startedAt: 1_000_000_000_000,
      endedAt: 1_000_000_010_000,
      durationSec: 10,
      billable: false,
      tagIds: [],
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  settings: {
    detailLevel: 'standard',
    onboardingCompleted: true,
    defaultBillable: false,
    currency: 'EUR',
    locale: 'de-DE',
    weekStart: 1,
    theme: 'system',
    roundTo: 0,
  },
}

describe('importSnapshot', () => {
  it('rejects malformed JSON without touching the DB', async () => {
    await expect(importSnapshot('not json')).rejects.toThrow(/gültiges JSON/)
  })

  it('rejects non-backup payloads', async () => {
    await expect(importSnapshot(JSON.stringify({ foo: 'bar' }))).rejects.toThrow(/Backup/)
  })

  it('rejects duplicate project ids before clearing the DB', async () => {
    const dup = {
      ...VALID_SNAPSHOT,
      projects: [VALID_SNAPSHOT.projects[0], { ...VALID_SNAPSHOT.projects[0] }],
    }
    await expect(importSnapshot(JSON.stringify(dup))).rejects.toThrow(/doppelte ID/)
    // DB should remain empty since the validation ran first.
    const projects = await listProjects()
    expect(projects).toHaveLength(0)
  })

  it('rejects entries with invalid startedAt', async () => {
    const bad = {
      ...VALID_SNAPSHOT,
      timeEntries: [{ ...VALID_SNAPSHOT.timeEntries[0], startedAt: 'oops' }],
    }
    await expect(importSnapshot(JSON.stringify(bad))).rejects.toThrow(/Startzeitpunkt/)
  })

  it('imports a valid snapshot end-to-end', async () => {
    const result = await importSnapshot(JSON.stringify(VALID_SNAPSHOT))
    expect(result).toEqual({ projects: 1, tags: 0, timeEntries: 1 })
    const entries = await listEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0].description).toBe('test')
  })
})
