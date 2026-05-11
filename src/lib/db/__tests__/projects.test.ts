import { describe, expect, it } from 'vitest'
import {
  countEntriesForProject,
  createProject,
  deleteProject,
} from '../projects'
import { createEntry, getEntry, listEntries } from '../timeEntries'

async function makeProject() {
  return createProject({
    name: 'Kunde A',
    color: '#000',
    billableDefault: false,
    archived: false,
  })
}

describe('deleteProject', () => {
  it('counts and removes references in linked entries atomically', async () => {
    const project = await makeProject()
    const e1 = await createEntry({
      description: 'a',
      startedAt: Date.now() - 60_000,
      endedAt: Date.now(),
      projectId: project.id,
      billable: false,
      tagIds: [],
    })
    const e2 = await createEntry({
      description: 'b',
      startedAt: Date.now() - 30_000,
      endedAt: Date.now(),
      projectId: project.id,
      billable: false,
      tagIds: [],
    })
    await createEntry({
      description: 'unrelated',
      startedAt: Date.now() - 90_000,
      endedAt: Date.now() - 80_000,
      billable: false,
      tagIds: [],
    })

    expect(await countEntriesForProject(project.id)).toBe(2)
    const result = await deleteProject(project.id)
    expect(result.cleaned).toBe(2)

    const after1 = await getEntry(e1.id)
    const after2 = await getEntry(e2.id)
    expect(after1?.projectId).toBeUndefined()
    expect(after2?.projectId).toBeUndefined()
    expect(await countEntriesForProject(project.id)).toBe(0)
    // Other entries still present
    const all = await listEntries()
    expect(all).toHaveLength(3)
  })

  it('returns cleaned: 0 when no entries reference the project', async () => {
    const project = await makeProject()
    const result = await deleteProject(project.id)
    expect(result.cleaned).toBe(0)
  })
})
