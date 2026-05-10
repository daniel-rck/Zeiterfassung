import type { Project } from '../types'
import { newId } from '../ids'
import { getDB } from './index'
import { broadcast } from './broadcast'

export type NewProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>

export async function createProject(input: NewProject): Promise<Project> {
  const now = Date.now()
  const project: Project = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDB()
  await db.add('projects', project)
  broadcast({ type: 'project-changed', id: project.id })
  return project
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<Project> {
  const db = await getDB()
  const existing = await db.get('projects', id)
  if (!existing) throw new Error(`Projekt ${id} nicht gefunden`)
  const updated: Project = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  await db.put('projects', updated)
  broadcast({ type: 'project-changed', id })
  return updated
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB()
  return db.get('projects', id)
}

export async function listProjects(options?: {
  includeArchived?: boolean
}): Promise<Project[]> {
  const db = await getDB()
  const all = await db.getAll('projects')
  const filtered = options?.includeArchived
    ? all
    : all.filter((p) => !p.archived)
  return filtered.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('projects', id)
  broadcast({ type: 'project-deleted', id })
}

export async function archiveProject(id: string): Promise<void> {
  await updateProject(id, { archived: true })
}

export async function restoreProject(id: string): Promise<void> {
  await updateProject(id, { archived: false })
}
