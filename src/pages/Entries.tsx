import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { deleteEntry } from '../lib/db/timeEntries'
import { dayKey } from '../lib/db'
import { EntryCard } from '../components/EntryCard'
import { DayGroup } from '../components/DayGroup'
import { Button } from '../components/ui/Button'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'

export function EntriesPage() {
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects()
  const { tags } = useTags()
  const { settings } = useSettings()
  const { atLeast } = useDetailLevel()
  const confirm = useConfirm()
  const toast = useToast()

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const groups = useMemo(() => {
    const map = new Map<string, { day: number; entries: typeof entries; sec: number; amount: number }>()
    for (const e of entries) {
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
  }, [entries, projectMap, atLeast])

  const handleDelete = async (id: string) => {
    const ok = await confirm.confirm({
      title: 'Eintrag löschen?',
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteEntry(id)
    toast.success('Gelöscht')
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
      {groups.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          Noch keine Einträge.
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
