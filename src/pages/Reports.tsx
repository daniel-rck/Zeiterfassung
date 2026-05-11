import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useEntries } from '../lib/hooks/useEntries'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useSettings } from '../lib/hooks/useSettings'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'
import { getRange } from '../lib/reports/range'
import {
  groupByDay,
  groupByProject,
  groupByTag,
  totalBillableAmount,
  totalDurationSec,
} from '../lib/reports/aggregate'
import { downloadCsv, entriesToCsv } from '../lib/io/exportCsv'
import { ReportFilters, type ReportFilterState } from '../components/ReportFilters'
import { ReportChart } from '../components/ReportChart'
import { Button } from '../components/ui/Button'
import { Gated } from '../components/Gated'
import { formatDuration, formatMoney, formatDecimalHours } from '../lib/format'

const INITIAL_FILTER: ReportFilterState = {
  preset: 'thisMonth',
  customFrom: '',
  customTo: '',
  projectId: 'all',
  tagId: 'all',
  billableOnly: false,
}

export function ReportsPage() {
  const { settings } = useSettings()
  const { atLeast } = useDetailLevel()
  const [filter, setFilter] = useState<ReportFilterState>(INITIAL_FILTER)

  const range = useMemo(() => {
    if (filter.preset === 'custom') {
      if (!filter.customFrom || !filter.customTo) return null
      const from = new Date(filter.customFrom)
      from.setHours(0, 0, 0, 0)
      const to = new Date(filter.customTo)
      to.setHours(23, 59, 59, 999)
      return { from: from.getTime(), to: to.getTime() }
    }
    return getRange(filter.preset, settings.weekStart)
  }, [filter, settings.weekStart])

  const entryFilter = useMemo(
    () => ({
      from: range?.from,
      to: range?.to,
      projectId:
        filter.projectId === 'all'
          ? undefined
          : filter.projectId === 'none'
            ? null
            : filter.projectId,
      billable: filter.billableOnly ? true : undefined,
      tagIds: filter.tagId === 'all' ? undefined : [filter.tagId],
    }),
    [range, filter],
  )

  const { entries } = useEntries(entryFilter)
  const { projects } = useProjects({ includeArchived: true })
  const { tags } = useTags({ includeArchived: true })

  const totalSec = useMemo(
    () => totalDurationSec(entries, { roundToMinutes: settings.roundTo }),
    [entries, settings.roundTo],
  )
  const billableInfo = useMemo(
    () => totalBillableAmount(entries, projects, { roundToMinutes: settings.roundTo }),
    [entries, projects, settings.roundTo],
  )
  const dayBuckets = useMemo(
    () => groupByDay(entries, projects, { roundToMinutes: settings.roundTo }),
    [entries, projects, settings.roundTo],
  )
  const projectBuckets = useMemo(
    () => groupByProject(entries, projects, { roundToMinutes: settings.roundTo }),
    [entries, projects, settings.roundTo],
  )
  const tagBuckets = useMemo(
    () => groupByTag(entries, projects, { roundToMinutes: settings.roundTo }),
    [entries, projects, settings.roundTo],
  )
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])

  const handleCsv = () => {
    if (entries.length === 0) return
    const csv = entriesToCsv(entries, projects, tags)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`zeiterfassung-${stamp}.csv`, csv)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Reports</h1>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleCsv}>
          CSV-Export
        </Button>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <ReportFilters state={filter} onChange={setFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Erfasste Zeit"
          value={formatDuration(totalSec, 'long')}
          hint={`${formatDecimalHours(totalSec, settings.locale)} Stunden`}
        />
        <StatCard label="Einträge" value={String(entries.length)} />
        {atLeast('pro') && (
          <StatCard
            label="Abrechenbar"
            value={
              billableInfo.currency
                ? formatMoney(billableInfo.amount, billableInfo.currency, settings.locale)
                : formatMoney(billableInfo.amount, settings.currency, settings.locale)
            }
          />
        )}
      </div>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Pro Tag
        </h2>
        <ReportChart buckets={dayBuckets} locale={settings.locale} />
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Pro Projekt
        </h2>
        {projectBuckets.length === 0 ? (
          <p className="text-sm text-zinc-500">Keine Daten.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {projectBuckets.map((bucket) => (
              <li
                key={bucket.projectId ?? 'none'}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate text-zinc-800 dark:text-zinc-200">
                  {bucket.projectName}
                </span>
                <span className="flex items-center gap-3 font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                  <span>{formatDecimalHours(bucket.durationSec, settings.locale)}h</span>
                  {atLeast('pro') && bucket.amount > 0 && bucket.currency && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatMoney(bucket.amount, bucket.currency, settings.locale)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Gated level="pro">
        {tagBuckets.length > 0 && (
          <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Pro Tag (Label)
            </h2>
            <ul className="space-y-2 text-sm">
              {tagBuckets.map((bucket) => {
                const tag = tagMap.get(bucket.tagId)
                if (!tag) return null
                return (
                  <li key={bucket.tagId} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatDecimalHours(bucket.durationSec, settings.locale)}h
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </Gated>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
      {hint && <div className="text-xs text-zinc-500">{hint}</div>}
    </div>
  )
}
