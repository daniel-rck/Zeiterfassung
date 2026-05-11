import { describe, expect, it } from 'vitest'
import { countEntriesForTag, createTag, deleteTag } from '../tags'
import { createEntry, getEntry } from '../timeEntries'

async function makeTag(name: string) {
  return createTag({ name, color: '#aaa', archived: false })
}

describe('deleteTag', () => {
  it('strips the tag id from every referencing entry', async () => {
    const tagA = await makeTag('urgent')
    const tagB = await makeTag('keep')
    const entry = await createEntry({
      description: '',
      startedAt: Date.now() - 60_000,
      endedAt: Date.now(),
      billable: false,
      tagIds: [tagA.id, tagB.id],
    })

    expect(await countEntriesForTag(tagA.id)).toBe(1)
    const result = await deleteTag(tagA.id)
    expect(result.cleaned).toBe(1)

    const updated = await getEntry(entry.id)
    expect(updated?.tagIds).toEqual([tagB.id])
  })
})
