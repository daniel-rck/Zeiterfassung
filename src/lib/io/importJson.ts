import type { DBSnapshot } from '../types'
import { getDB, dayKey, DB_VERSION } from '../db'
import { broadcast } from '../db/broadcast'
import { writeSettings } from '../db/settings'

export interface ImportResult {
  projects: number
  tags: number
  timeEntries: number
}

function isSnapshot(value: unknown): value is DBSnapshot {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<DBSnapshot>
  return (
    v.app === 'zeiterfassung' &&
    typeof v.schemaVersion === 'number' &&
    Array.isArray(v.projects) &&
    Array.isArray(v.tags) &&
    Array.isArray(v.timeEntries) &&
    typeof v.settings === 'object'
  )
}

export async function importSnapshot(json: string): Promise<ImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Datei ist kein gültiges JSON.')
  }
  if (!isSnapshot(parsed)) {
    throw new Error('Datei ist kein gültiges Zeiterfassung-Backup.')
  }
  if (parsed.schemaVersion > DB_VERSION) {
    throw new Error(
      `Backup wurde mit einer neueren App-Version (Schema ${parsed.schemaVersion}) erstellt.`,
    )
  }
  const db = await getDB()
  const tx = db.transaction(['projects', 'tags', 'time_entries'], 'readwrite')
  await tx.objectStore('projects').clear()
  await tx.objectStore('tags').clear()
  await tx.objectStore('time_entries').clear()
  for (const project of parsed.projects) {
    await tx.objectStore('projects').put(project)
  }
  for (const tag of parsed.tags) {
    await tx.objectStore('tags').put(tag)
  }
  for (const entry of parsed.timeEntries) {
    await tx.objectStore('time_entries').put({
      ...entry,
      startedAtDay: dayKey(entry.startedAt),
      running: entry.endedAt == null ? 1 : 0,
    })
  }
  await tx.done
  writeSettings(parsed.settings)
  broadcast({ type: 'db-cleared' })
  return {
    projects: parsed.projects.length,
    tags: parsed.tags.length,
    timeEntries: parsed.timeEntries.length,
  }
}

export async function pickAndImport(): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('Keine Datei ausgewählt.'))
        return
      }
      try {
        const text = await file.text()
        const result = await importSnapshot(text)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    input.click()
  })
}
