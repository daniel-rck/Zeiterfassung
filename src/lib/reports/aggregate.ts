import type { Project, TimeEntry } from '../types'
import { dayKey } from '../db'
import { roundDurationSec } from '../duration'

export interface DayBucket {
  day: string
  durationSec: number
  amount: number
}

export interface ProjectBucket {
  projectId: string | null
  projectName: string
  durationSec: number
  billableSec: number
  amount: number
  currency?: string
}

export interface TagBucket {
  tagId: string
  durationSec: number
  amount: number
}

export interface AggregateOptions {
  roundToMinutes: 0 | 1 | 5 | 15 | 30
}

const DEFAULT_OPTIONS: AggregateOptions = { roundToMinutes: 0 }

export function totalDurationSec(
  entries: TimeEntry[],
  options: AggregateOptions = DEFAULT_OPTIONS,
): number {
  return entries.reduce(
    (sum, e) => sum + roundDurationSec(e.durationSec, options.roundToMinutes),
    0,
  )
}

export function totalBillableAmount(
  entries: TimeEntry[],
  projects: Project[],
  options: AggregateOptions = DEFAULT_OPTIONS,
): { amount: number; currency: string | undefined } {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  let amount = 0
  let currency: string | undefined
  for (const e of entries) {
    if (!e.billable) continue
    const rate = e.hourlyRateSnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
    if (rate == null) continue
    const sec = roundDurationSec(e.durationSec, options.roundToMinutes)
    amount += (sec / 3600) * rate
    currency = currency ?? e.currencySnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.currency : undefined)
  }
  return { amount, currency }
}

export function groupByDay(
  entries: TimeEntry[],
  projects: Project[],
  options: AggregateOptions = DEFAULT_OPTIONS,
): DayBucket[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const map = new Map<string, DayBucket>()
  for (const e of entries) {
    const day = dayKey(e.startedAt)
    const sec = roundDurationSec(e.durationSec, options.roundToMinutes)
    const rate = e.hourlyRateSnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
    const amount = e.billable && rate ? (sec / 3600) * rate : 0
    const bucket = map.get(day) ?? { day, durationSec: 0, amount: 0 }
    bucket.durationSec += sec
    bucket.amount += amount
    map.set(day, bucket)
  }
  return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day))
}

export function groupByProject(
  entries: TimeEntry[],
  projects: Project[],
  options: AggregateOptions = DEFAULT_OPTIONS,
): ProjectBucket[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const map = new Map<string, ProjectBucket>()
  for (const e of entries) {
    const key = e.projectId ?? '__none__'
    const project = e.projectId ? projectMap.get(e.projectId) : undefined
    const sec = roundDurationSec(e.durationSec, options.roundToMinutes)
    const rate = e.hourlyRateSnapshot ?? project?.hourlyRate
    const amount = e.billable && rate ? (sec / 3600) * rate : 0
    const bucket: ProjectBucket =
      map.get(key) ??
      {
        projectId: e.projectId ?? null,
        projectName: project?.name ?? 'Ohne Projekt',
        durationSec: 0,
        billableSec: 0,
        amount: 0,
        currency: e.currencySnapshot ?? project?.currency,
      }
    bucket.durationSec += sec
    if (e.billable) bucket.billableSec += sec
    bucket.amount += amount
    if (!bucket.currency) bucket.currency = e.currencySnapshot ?? project?.currency
    map.set(key, bucket)
  }
  return Array.from(map.values()).sort((a, b) => b.durationSec - a.durationSec)
}

export function groupByTag(
  entries: TimeEntry[],
  projects: Project[],
  options: AggregateOptions = DEFAULT_OPTIONS,
): TagBucket[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const map = new Map<string, TagBucket>()
  for (const e of entries) {
    const sec = roundDurationSec(e.durationSec, options.roundToMinutes)
    const rate = e.hourlyRateSnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
    const amount = e.billable && rate ? (sec / 3600) * rate : 0
    for (const tagId of e.tagIds) {
      const bucket = map.get(tagId) ?? { tagId, durationSec: 0, amount: 0 }
      bucket.durationSec += sec
      bucket.amount += amount
      map.set(tagId, bucket)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.durationSec - a.durationSec)
}
