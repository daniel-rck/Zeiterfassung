import type { Tag } from '../types'
import { newId } from '../ids'
import { getDB } from './index'
import { broadcast } from './broadcast'

export type NewTag = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>

export async function createTag(input: NewTag): Promise<Tag> {
  const now = Date.now()
  const tag: Tag = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDB()
  await db.add('tags', tag)
  broadcast({ type: 'tag-changed', id: tag.id })
  return tag
}

export async function updateTag(
  id: string,
  patch: Partial<Omit<Tag, 'id' | 'createdAt'>>,
): Promise<Tag> {
  const db = await getDB()
  const existing = await db.get('tags', id)
  if (!existing) throw new Error(`Tag ${id} nicht gefunden`)
  const updated: Tag = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  await db.put('tags', updated)
  broadcast({ type: 'tag-changed', id })
  return updated
}

export async function getTag(id: string): Promise<Tag | undefined> {
  const db = await getDB()
  return db.get('tags', id)
}

export async function listTags(options?: {
  includeArchived?: boolean
}): Promise<Tag[]> {
  const db = await getDB()
  const all = await db.getAll('tags')
  const filtered = options?.includeArchived ? all : all.filter((t) => !t.archived)
  return filtered.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tags', id)
  broadcast({ type: 'tag-deleted', id })
}
