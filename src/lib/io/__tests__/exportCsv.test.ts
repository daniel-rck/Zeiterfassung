import { describe, expect, it } from 'vitest'
import { entriesToCsv } from '../exportCsv'
import type { Project, Tag, TimeEntry } from '../../types'

function makeEntry(over: Partial<TimeEntry> = {}): TimeEntry {
  const start = new Date('2026-05-10T10:00:00Z').getTime()
  return {
    id: 'e1',
    description: 'work',
    startedAt: start,
    endedAt: start + 3600_000,
    durationSec: 3600,
    billable: false,
    tagIds: [],
    createdAt: start,
    updatedAt: start,
    ...over,
  }
}

describe('entriesToCsv', () => {
  it('prefixes formula triggers with an apostrophe', () => {
    const csv = entriesToCsv(
      [
        makeEntry({ description: '=cmd|"/c calc"!A1' }),
        makeEntry({ id: 'e2', description: '+SUM(A1)' }),
        makeEntry({ id: 'e3', description: '-1+1' }),
        makeEntry({ id: 'e4', description: '@SUM(A1)' }),
      ],
      [],
      [],
    )
    expect(csv).toContain(`"'=cmd|""/c calc""!A1"`)
    expect(csv).toContain(`'+SUM(A1)`)
    expect(csv).toContain(`'-1+1`)
    expect(csv).toContain(`'@SUM(A1)`)
  })

  it('leaves benign descriptions untouched', () => {
    const csv = entriesToCsv([makeEntry({ description: 'Refactor login' })], [], [])
    expect(csv).toContain('Refactor login')
    expect(csv).not.toContain(`'Refactor`)
  })

  it('leaves numeric cells unprefixed', () => {
    const project: Project = {
      id: 'p1',
      name: 'P',
      color: '#000',
      billableDefault: true,
      hourlyRate: 50,
      currency: 'EUR',
      archived: false,
      createdAt: 0,
      updatedAt: 0,
    }
    const csv = entriesToCsv(
      [makeEntry({ projectId: 'p1', billable: true, hourlyRateSnapshot: 50, currencySnapshot: 'EUR' })],
      [project],
      [],
    )
    // hours column "1.00" must not become "'1.00"
    expect(csv).toMatch(/;1\.00;/)
  })

  it('escapes quotes and separators correctly', () => {
    const tag: Tag = {
      id: 't1',
      name: 'urgent',
      color: '#f00',
      archived: false,
      createdAt: 0,
      updatedAt: 0,
    }
    const csv = entriesToCsv(
      [makeEntry({ description: 'has ; semicolon and "quote"', tagIds: ['t1'] })],
      [],
      [tag],
    )
    expect(csv).toContain(`"has ; semicolon and ""quote"""`)
  })
})
