import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { TimerHero } from '../components/TimerHero'
import { EntryCard } from '../components/EntryCard'
import { DayGroup } from '../components/DayGroup'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { deleteEntry } from '../lib/db/timeEntries'
import { dayKey } from '../lib/db'
import { Button } from '../components/ui/Button'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'

export function TodayPage() {
  const { settings } = useSettings()
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects()
  const { tags } = useTags()
  const { atLeast } = useDetailLevel()
  const confirm = useConfirm()
  const toast = useToast()

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = dayKey(today.getTime())
  const todays = entries.filter((e) => dayKey(e.startedAt) === todayKey)
  const todayTotalSec = todays.reduce((s, e) => s + e.durationSec, 0)
  const todayAmount = atLeast('pro')
    ? todays.reduce((sum, e) => {
        if (!e.billable) return sum
        const rate = e.hourlyRateSnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
        if (rate == null) return sum
        return sum + (e.durationSec / 3600) * rate
      }, 0)
    : 0

  const handleDelete = async (id: string) => {
    const ok = await confirm.confirm({
      title: 'Eintrag löschen?',
      description: 'Dieser Eintrag wird endgültig entfernt.',
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteEntry(id)
    toast.success('Gelöscht')
  }

  return (
    <div className="space-y-6">
      <TimerHero />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Heute</h2>
          <Link to="/entry/new">
            <Button size="sm" variant="secondary" icon={<Plus size={14} />}>
              Manuell
            </Button>
          </Link>
        </div>
        {todays.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            Noch keine Einträge heute. Drück auf den großen Knopf oder die Leertaste.
          </p>
        ) : (
          <DayGroup
            dayTimestamp={today.getTime()}
            totalSec={todayTotalSec}
            amount={todayAmount}
            currency={settings.currency}
            locale={settings.locale}
          >
            {todays.map((entry) => (
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
        )}
      </section>
    </div>
  )
}
