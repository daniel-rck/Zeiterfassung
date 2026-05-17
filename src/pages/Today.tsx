import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Database } from 'lucide-react'
import { TimerHero } from '../components/TimerHero'
import { EntryRow } from '../components/EntryRow'
import { HoursAccountCard } from '../components/HoursAccountCard'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { deleteEntry, restoreEntry } from '../lib/db/timeEntries'
import { dayKey } from '../lib/db'
import { getRange } from '../lib/reports/range'
import { Button } from '../components/ui/Button'
import { MetricCard } from '../components/ui/MetricCard'
import { useConfirm } from '../components/ui/Confirm'
import { useToast } from '../components/ui/Toast'
import { useFeature } from '../lib/hooks/useFeature'
import { downloadSnapshot } from '../lib/io/exportJson'
import { patchSettings } from '../lib/db/settings'
import {
  formatDecimalHours,
  formatDuration,
  formatMoney,
  formatRelativeDay,
} from '../lib/format'

const BACKUP_REMINDER_DAYS = 14
const BACKUP_DISMISS_KEY = 'zeiterfassung:backup-banner-dismissed'

export function TodayPage() {
  const { settings } = useSettings()
  const { entries } = useEntries({ includeRunning: true })
  const { projects } = useProjects()
  const { tags } = useTags()
  const billingOn = useFeature('billing')
  const hoursAccountOn = useFeature('hoursAccount')
  const confirm = useConfirm()
  const toast = useToast()

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  )
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const todayKey = dayKey(today.getTime())
  const todays = entries.filter((e) => dayKey(e.startedAt) === todayKey)
  const todayTotalSec = todays.reduce((s, e) => s + e.durationSec, 0)

  const weekRange = useMemo(
    () => getRange('thisWeek', settings.weekStart),
    [settings.weekStart],
  )
  const monthRange = useMemo(() => getRange('thisMonth', settings.weekStart), [
    settings.weekStart,
  ])

  const weekSec = useMemo(() => {
    if (!weekRange) return 0
    return entries
      .filter((e) => e.startedAt >= weekRange.from && e.startedAt <= weekRange.to)
      .reduce((s, e) => s + e.durationSec, 0)
  }, [entries, weekRange])

  const monthSec = useMemo(() => {
    if (!monthRange) return 0
    return entries
      .filter(
        (e) => e.startedAt >= monthRange.from && e.startedAt <= monthRange.to,
      )
      .reduce((s, e) => s + e.durationSec, 0)
  }, [entries, monthRange])

  const billableAmount = useMemo(() => {
    if (!billingOn || !monthRange) return 0
    return entries
      .filter(
        (e) =>
          e.billable &&
          e.startedAt >= monthRange.from &&
          e.startedAt <= monthRange.to,
      )
      .reduce((sum, e) => {
        const rate =
          e.hourlyRateSnapshot ??
          (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
        if (rate == null) return sum
        return sum + (e.durationSec / 3600) * rate
      }, 0)
  }, [entries, monthRange, projectMap, billingOn])

  const todayAmount = billingOn
    ? todays.reduce((sum, e) => {
        if (!e.billable) return sum
        const rate =
          e.hourlyRateSnapshot ??
          (e.projectId ? projectMap.get(e.projectId)?.hourlyRate : undefined)
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

  const hoursAccountTarget = (settings.targetHoursPerWeek ?? 0) * 3600

  return (
    <div className="space-y-6">
      {showBackupBanner && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border-l-2 border-[color:var(--color-warn-500)] bg-[color:var(--color-warn-500)]/8 p-3 pl-4 text-sm"
        >
          <Database
            size={16}
            className="mt-0.5 flex-shrink-0 text-[color:var(--color-warn-600)] dark:text-[color:var(--color-warn-500)]"
          />
          <div className="flex-1 text-[color:var(--color-text-2)]">
            <strong className="font-semibold text-[color:var(--color-text-1)]">
              Backup empfohlen.
            </strong>{' '}
            {settings.lastBackupAt == null
              ? 'Du hast noch kein Backup angelegt — deine Einträge liegen nur in diesem Browser.'
              : `Dein letztes Backup ist ${backupAgeDays} Tage alt.`}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button size="sm" variant="secondary" onClick={() => void handleBackupNow()}>
              Jetzt sichern
            </Button>
            <button
              type="button"
              onClick={dismissBackup}
              aria-label="Hinweis schließen"
              className="rounded p-1 text-[color:var(--color-text-3)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)] no-min-tap"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            {formatRelativeDay(today.getTime(), settings.locale)}
          </h1>
          <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
            {new Intl.DateTimeFormat(settings.locale, {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(today)}
          </p>
        </div>
        <Link to="/entry/new" className="hidden sm:inline-flex">
          <Button variant="outline" size="sm" icon={<Plus size={14} />}>
            Manuell
          </Button>
        </Link>
      </div>

      <TimerHero />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Heute"
          value={formatDuration(todayTotalSec, 'short')}
          hint={`${formatDecimalHours(todayTotalSec, settings.locale)} h`}
        />
        <MetricCard
          label="Woche"
          value={`${formatDecimalHours(weekSec, settings.locale)} h`}
          hint={
            hoursAccountTarget > 0
              ? `${Math.round((weekSec / hoursAccountTarget) * 100)}% von Soll`
              : 'Diese Woche'
          }
        />
        <MetricCard
          label="Monat"
          value={`${formatDecimalHours(monthSec, settings.locale)} h`}
          hint={new Intl.DateTimeFormat(settings.locale, {
            month: 'long',
          }).format(today)}
        />
        {billingOn ? (
          <MetricCard
            label="Abrechenbar"
            value={formatMoney(billableAmount, settings.currency, settings.locale)}
            hint="Diesen Monat"
            accent="success"
          />
        ) : (
          <MetricCard
            label="Einträge"
            value={String(todays.length)}
            hint="heute"
          />
        )}
      </div>

      {hoursAccountOn && <HoursAccountCard />}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-3)]">
            Heutige Einträge
          </h2>
          {todays.length > 0 && billingOn && todayAmount > 0 && (
            <span className="tnum text-xs font-medium text-[color:var(--color-success-600)] dark:text-[color:var(--color-success-500)]">
              {formatMoney(todayAmount, settings.currency, settings.locale)}
            </span>
          )}
        </div>
        {todays.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-8 text-center">
            <p className="text-sm text-[color:var(--color-text-2)]">
              Noch keine Einträge heute.
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-text-3)]">
              Tippe oben auf <strong>Start</strong> oder drücke die Leertaste.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todays.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                project={
                  entry.projectId ? projectMap.get(entry.projectId) : undefined
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
          </div>
        )}
      </section>
    </div>
  )
}
