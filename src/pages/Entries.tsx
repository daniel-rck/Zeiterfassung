import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { deleteEntry, restoreEntry } from '../lib/db/timeEntries'
import { dayKey } from '../lib/db'
import { EntryCard } from '../components/EntryCard'
import { DayGroup } from '../components/DayGroup'
import { Button } from '../components/ui/Button'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'

export function EntriesPage() {
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects({ includeArchived: true })
  const { tags } = useTags({ includeArchived: true })
  const { settings } = useSettings()
  const { atLeast } = useDetailLevel()
  const confirm = useConfirm()
  const toast = useToast()
  const [query, setQuery] = useState('')

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => {
      if (e.description.toLowerCase().includes(q)) return true
      if (e.notes?.toLowerCase().includes(q)) return true
      const project = e.projectId ? projectMap.get(e.projectId) : undefined
      if (project?.name.toLowerCase().includes(q)) return true
      if (project?.client?.toLowerCase().includes(q)) return true
      for (const tagId of e.tagIds) {
        if (tagMap.get(tagId)?.name.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [entries, query, projectMap, tagMap])

  const groups = useMemo(() => {
    const map = new Map<string, { day: number; entries: typeof filtered; sec: number; amount: number }>()
    for (const e of filtered) {
      const key = dayKey(e.startedAt)
      const day = new Date(e.startedAt)
      day.setHours(0, 0, 0, 0)
      const rate = e.hourlyRateSnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
      const amount = atLeast('pro') && e.billable && rate ? (e.durationSec / 3600) * rate : 0
      const bucket = map.get(key) ?? { day: day.getTime(), entries: [], sec: 0, amount: 0 }
      bucket.entries.push(e)
      bucket.sec += e.durationSec
      bucket.amount += amount
      map.set(key, bucket)
    }
    return Array.from(map.values()).sort((a, b) => b.day - a.day)
  }, [filtered, projectMap, atLeast])

  const handleDelete = async (id: string) => {
    const snapshot = entries.find((e) => e.id === id)
    const ok = await confirm.confirm({
      title: 'Eintrag löschen?',
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteEntry(id)
    toast.success('Gelöscht', {
      action: snapshot
        ? {
            label: 'Rückgängig',
            onClick: () => {
              void restoreEntry(snapshot)
            },
          }
        : undefined,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Alle Einträge</h1>
        <Link to="/entry/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Neuer Eintrag
          </Button>
        </Link>
      </div>
      {entries.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen — Beschreibung, Projekt, Kunde, Tag"
            aria-label="Einträge suchen"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-9 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Suche leeren"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 no-min-tap"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {groups.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {entries.length === 0
            ? 'Noch keine Einträge.'
            : 'Kein Eintrag passt zur Suche.'}
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <DayGroup
              key={group.day}
              dayTimestamp={group.day}
              totalSec={group.sec}
              amount={group.amount}
              currency={settings.currency}
              locale={settings.locale}
            >
              {group.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  project={entry.projectId ? projectMap.get(entry.projectId) : undefined}
                  tags={entry.tagIds.map((id) => tagMap.get(id)).filter(Boolean) as typeof tags}
                  locale={settings.locale}
                  onDelete={(id) => void handleDelete(id)}
                />
              ))}
            </DayGroup>
          ))}
        </div>
      )}
    </div>
  )
}
