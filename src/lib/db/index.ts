import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Project, Tag, TimeEntry } from '../types'

export const DB_NAME = 'zeiterfassung'
export const DB_VERSION = 1

export type StoredTimeEntry = TimeEntry & {
  startedAtDay: string
  running: 0 | 1
}

export interface ZeiterfassungDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: {
      byName: string
      byArchived: number
    }
  }
  tags: {
    key: string
    value: Tag
    indexes: {
      byName: string
    }
  }
  time_entries: {
    key: string
    value: StoredTimeEntry
    indexes: {
      byProjectId: string
      byStartedAt: number
      byStartedAtDay: string
      byRunning: number
    }
  }
}

export function dayKey(timestamp: number): string {
  const d = new Date(timestamp)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

let dbPromise: Promise<IDBPDatabase<ZeiterfassungDB>> | null = null

export function getDB(): Promise<IDBPDatabase<ZeiterfassungDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZeiterfassungDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const projects = db.createObjectStore('projects', { keyPath: 'id' })
          projects.createIndex('byName', 'name')
          projects.createIndex('byArchived', 'archived')

          const tags = db.createObjectStore('tags', { keyPath: 'id' })
          tags.createIndex('byName', 'name')

          const entries = db.createObjectStore('time_entries', { keyPath: 'id' })
          entries.createIndex('byProjectId', 'projectId')
          entries.createIndex('byStartedAt', 'startedAt')
          entries.createIndex('byStartedAtDay', 'startedAtDay')
          entries.createIndex('byRunning', 'running')
        }
      },
      blocked() {
        console.warn('[zeiterfassung] DB upgrade blocked')
      },
      blocking() {
        void getDB().then((db) => db.close())
        dbPromise = null
      },
    })
  }
  return dbPromise
}

export async function _resetDBForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
  }
  dbPromise = null
}
