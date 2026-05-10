import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { _resetDBForTests, getDB } from '../lib/db'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

afterEach(async () => {
  cleanup()
  try {
    const db = await getDB()
    const tx = db.transaction(['projects', 'tags', 'time_entries'], 'readwrite')
    await tx.objectStore('projects').clear()
    await tx.objectStore('tags').clear()
    await tx.objectStore('time_entries').clear()
    await tx.done
  } catch {
    // ignore — DB may not exist yet
  }
  await _resetDBForTests()
  window.localStorage.clear()
})
