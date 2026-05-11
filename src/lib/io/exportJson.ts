import type { DBSnapshot } from '../types'
import { getDB, DB_VERSION } from '../db'
import { readSettings } from '../db/settings'

export async function buildSnapshot(): Promise<DBSnapshot> {
  const db = await getDB()
  const projects = await db.getAll('projects')
  const tags = await db.getAll('tags')
  const stored = await db.getAll('time_entries')
  const timeEntries = stored.map((e) => {
    const { startedAtDay: _d, running: _r, ...rest } = e
    void _d
    void _r
    return rest
  })
  const invoices = await db.getAll('invoices')
  return {
    schemaVersion: DB_VERSION,
    exportedAt: Date.now(),
    app: 'zeiterfassung',
    projects,
    tags,
    timeEntries,
    invoices,
    settings: readSettings(),
  }
}

export async function downloadSnapshot(): Promise<void> {
  const snapshot = await buildSnapshot()
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date(snapshot.exportedAt)
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  a.download = `zeiterfassung-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
