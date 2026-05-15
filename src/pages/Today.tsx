import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { TimerHero } from '../components/TimerHero'
import { EntryCard } from '../components/EntryCard'
import { DayGroup } from '../components/DayGroup'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { deleteEntry, restoreEntry } from '../lib/db/timeEntries'
import { dayKey } from '../lib/db'
import { Button } from '../components/ui/Button'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'
import { useFeature } from '../lib/hooks/useFeature'
import { downloadSnapshot } from '../lib/io/exportJson'
import { patchSettings } from '../lib/db/settings'

const BACKUP_REMINDER_DAYS = 14
const BACKUP_DISMISS_KEY = 'zeiterfassung:backup-banner-dismissed'

export function TodayPage() {
  const { settings } = useSettings()
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects()
  const { tags } = useTags()
  const billingOn = useFeature('billing')
  const confirm = useConfirm()
  const toast = useToast()

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = dayKey(today.getTime())
  const todays = entries.filter((e) => dayKey(e.startedAt) === todayKey)
  const todayTotalSec = todays.reduce((s, e) => s + e.durationSec, 0)
  const todayAmount = billingOn
    ? todays.reduce((sum, e) => {
        if (!e.billable) return sum
        const rate = e.hourlyRateSnapshot ?? (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
        if (rate == null) return sum
        return sum + (e.durationSec / 3600) * rate
      }, 0)
    : 0

  const [backupDismissed, setBackupDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(BACKUP_DISMISS_KEY) === '1'
  })

  const dismissBackup = () => {
    setBackupDismissed(true)
    try {
      window.localStorage.setItem(BACKUP_DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  const handleBackupNow = async () => {
    try {
      await downloadSnapshot()
      patchSettings({ lastBackupAt: Date.now() })
      try {
        window.localStorage.removeItem(BACKUP_DISMISS_KEY)
      } catch {
        // ignore
      }
      setBackupDismissed(false)
      toast.success('Backup heruntergeladen')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const backupAgeDays =
    settings.lastBackupAt != null
      ? Math.floor((Date.now() - settings.lastBackupAt) / 86_400_000)
      : null
  const showBackupBanner =
    !backupDismissed &&
    entries.length > 0 &&
    (settings.lastBackupAt == null || (backupAgeDays ?? 0) >= BACKUP_REMINDER_DAYS)

  const handleDelete = async (id: string) => {
    const snapshot = entries.find((e) => e.id === id)
    const ok = await confirm.confirm({
      title: 'Eintrag löschen?',
      description: 'Dieser Eintrag wird endgültig entfernt.',
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
    <div className="space-y-6">
      {showBackupBanner && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900"
        >
          <div className="flex-1">
            <strong className="font-semibold">Backup empfohlen.</strong>{' '}
            {settings.lastBackupAt == null
              ? 'Du hast noch kein Backup angelegt — deine Einträge liegen nur in diesem Browser.'
              : `Dein letztes Backup ist ${backupAgeDays} Tage alt.`}
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button size="sm" variant="primary" onClick={() => void handleBackupNow()}>
              Jetzt sichern
            </Button>
            <button
              type="button"
              onClick={dismissBackup}
              aria-label="Hinweis schließen"
              className="rounded p-1 text-amber-900/70 hover:bg-amber-100 dark:text-amber-200/70 dark:hover:bg-amber-900/40"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
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
