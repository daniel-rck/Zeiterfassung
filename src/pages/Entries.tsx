import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { deleteEntry, restoreEntry } from '../lib/db/timeEntries'
import { dayKey } from '../lib/db'
import { EntryRow } from '../components/EntryRow'
import { DayGroup } from '../components/DayGroup'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'
import { useFeature } from '../lib/hooks/useFeature'

export function EntriesPage() {
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects({ includeArchived: true })
  const { tags } = useTags({ includeArchived: true })
  const { settings } = useSettings()
  const billingOn = useFeature('billing')
  const confirm = useConfirm()
  const toast = useToast()
  const [query, setQuery] = useState('')

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  )
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
    const map = new Map<
      string,
      { day: number; entries: typeof filtered; sec: number; amount: number }
    >()
    for (const e of filtered) {
      const key = dayKey(e.startedAt)
      const day = new Date(e.startedAt)
      day.setHours(0, 0, 0, 0)
      const rate =
        e.hourlyRateSnapshot ??
        (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
      const amount =
        billingOn && e.billable && rate ? (e.durationSec / 3600) * rate : 0
      const bucket = map.get(key) ?? {
        day: day.getTime(),
        entries: [],
        sec: 0,
        amount: 0,
      }
      bucket.entries.push(e)
      bucket.sec += e.durationSec
      bucket.amount += amount
      map.set(key, bucket)
    }
    return Array.from(map.values()).sort((a, b) => b.day - a.day)
  }, [filtered, projectMap, billingOn])

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Alle Einträge
          </h1>
          <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
            {entries.length} Eintrag{entries.length === 1 ? '' : 'e'} insgesamt
          </p>
        </div>
        <Link to="/entry/new">
          <Button variant="primary" size="sm" icon={<Plus size={14} />}>
            Neuer Eintrag
          </Button>
        </Link>
      </div>

      {entries.length > 0 && (
        <Input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen — Beschreibung, Projekt, Kunde, Tag"
          aria-label="Einträge suchen"
          leadingIcon={<Search size={14} />}
          trailingIcon={
            query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Suche leeren"
                className="rounded p-0.5 hover:bg-[color:var(--color-surface-2)] no-min-tap"
              >
                <X size={12} />
              </button>
            ) : undefined
          }
        />
      )}

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-8 text-center text-sm text-[color:var(--color-text-3)]">
          {entries.length === 0
            ? 'Noch keine Einträge.'
            : 'Kein Eintrag passt zur Suche.'}
        </div>
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
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  project={
                    entry.projectId
                      ? projectMap.get(entry.projectId)
                      : undefined
                  }
                  tags={
                    entry.tagIds
                      .map((id) => tagMap.get(id))
                      .filter(Boolean) as typeof tags
                  }
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
