import { Download } from "lucide-react";
import { useMemo } from "react";
import { DonutChart, type DonutSlice } from "../components/charts/DonutChart";
import { Gated } from "../components/Gated";
import { ReportChart } from "../components/ReportChart";
import { type ReportFilterState, ReportFilters } from "../components/ReportFilters";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { at } from "../lib/at.ts";
import { formatDecimalHours, formatDuration, formatMoney } from "../lib/format";
import { useEntries } from "../lib/hooks/useEntries";
import { useFeatures } from "../lib/hooks/useFeature";
import { useFilterState } from "../lib/hooks/useFilterState";
import { useProjects } from "../lib/hooks/useProjects";
import { useSettings } from "../lib/hooks/useSettings";
import { useTags } from "../lib/hooks/useTags";
import { downloadCsv, entriesToCsv } from "../lib/io/exportCsv";
import {
  groupByDay,
  groupByProject,
  groupByTag,
  totalBillableAmount,
  totalDurationSec,
} from "../lib/reports/aggregate";
import { getRange } from "../lib/reports/range";

const INITIAL_FILTER: ReportFilterState = {
  preset: "thisMonth",
  customFrom: "",
  customTo: "",
  projectId: "all",
  tagId: "all",
  billableOnly: false,
};

const FALLBACK_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function ReportsPage() {
  const { settings } = useSettings();
  const features = useFeatures();
  const [filter, setFilter] = useFilterState<ReportFilterState>("reports", INITIAL_FILTER);

  const range = useMemo(() => {
    if (filter.preset === "custom") {
      if (!filter.customFrom || !filter.customTo) return null;
      const from = new Date(filter.customFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(filter.customTo);
      to.setHours(23, 59, 59, 999);
      if (from.getTime() > to.getTime()) {
        return { from: to.getTime(), to: from.getTime() };
      }
      return { from: from.getTime(), to: to.getTime() };
    }
    return getRange(filter.preset, settings.weekStart);
  }, [filter, settings.weekStart]);

  const rangeWarning =
    filter.preset === "custom" &&
    filter.customFrom &&
    filter.customTo &&
    new Date(filter.customFrom).getTime() > new Date(filter.customTo).getTime()
      ? "Von ist nach Bis — Reihenfolge wurde getauscht."
      : null;

  const entryFilter = useMemo(
    () => ({
      from: range?.from,
      to: range?.to,
      projectId:
        filter.projectId === "all"
          ? undefined
          : filter.projectId === "none"
            ? null
            : filter.projectId,
      billable: filter.billableOnly ? true : undefined,
      tagIds: filter.tagId === "all" ? undefined : [filter.tagId],
    }),
    [range, filter],
  );

  const { entries } = useEntries(entryFilter);
  const { projects } = useProjects({ includeArchived: true });
  const { tags } = useTags({ includeArchived: true });

  const totalSec = useMemo(
    () => totalDurationSec(entries, { roundToMinutes: settings.roundTo }),
    [entries, settings.roundTo],
  );
  const billableInfo = useMemo(
    () =>
      totalBillableAmount(entries, projects, {
        roundToMinutes: settings.roundTo,
      }),
    [entries, projects, settings.roundTo],
  );
  const dayBuckets = useMemo(
    () => groupByDay(entries, projects, { roundToMinutes: settings.roundTo }),
    [entries, projects, settings.roundTo],
  );
  const projectBuckets = useMemo(
    () =>
      groupByProject(entries, projects, {
        roundToMinutes: settings.roundTo,
      }),
    [entries, projects, settings.roundTo],
  );
  const tagBuckets = useMemo(
    () => groupByTag(entries, projects, { roundToMinutes: settings.roundTo }),
    [entries, projects, settings.roundTo],
  );
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const donutSlices: DonutSlice[] = projectBuckets.map((b, i) => {
    const proj = b.projectId ? projectMap.get(b.projectId) : undefined;
    return {
      key: b.projectId ?? "none",
      label: b.projectName,
      value: b.durationSec,
      color: proj?.color ?? at(FALLBACK_COLORS, i % FALLBACK_COLORS.length),
      display: `${formatDecimalHours(b.durationSec, settings.locale)} h`,
    };
  });

  const handleCsv = () => {
    if (entries.length === 0) return;
    const csv = entriesToCsv(entries, projects, tags);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`zeiterfassung-${stamp}.csv`, csv);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Reports
          </h1>
          <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
            Erfasste Zeit über Zeiträume, Projekte und Tags.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleCsv}
          disabled={entries.length === 0}
        >
          CSV-Export
        </Button>
      </div>

      <Card padding="md">
        <ReportFilters state={filter} onChange={setFilter} />
        {rangeWarning && (
          <p className="mt-3 text-xs text-[color:var(--color-warn-600)] dark:text-[color:var(--color-warn-500)]">
            {rangeWarning}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Erfasste Zeit"
          value={formatDuration(totalSec, "long")}
          hint={`${formatDecimalHours(totalSec, settings.locale)} Stunden`}
        />
        <MetricCard label="Einträge" value={String(entries.length)} />
        {features.billing && (
          <MetricCard
            label="Abrechenbar"
            value={
              billableInfo.currency
                ? formatMoney(billableInfo.amount, billableInfo.currency, settings.locale)
                : formatMoney(billableInfo.amount, settings.currency, settings.locale)
            }
            accent="success"
          />
        )}
      </div>

      <Card padding="md">
        <CardHeader title="Pro Tag" description="Aufgewendete Stunden je Tag" />
        <ReportChart buckets={dayBuckets} locale={settings.locale} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="md">
          <CardHeader
            title="Pro Projekt"
            description={`${projectBuckets.length} Projekt${projectBuckets.length === 1 ? "" : "e"}`}
          />
          {projectBuckets.length === 0 ? (
            <p className="text-sm text-[color:var(--color-text-3)]">Keine Daten.</p>
          ) : (
            <DonutChart
              slices={donutSlices}
              centerLabel="Gesamt"
              centerValue={`${formatDecimalHours(totalSec, settings.locale)}h`}
              ariaLabel="Stunden pro Projekt"
              size={160}
            />
          )}
        </Card>

        <Gated feature="tags">
          <Card padding="md">
            <CardHeader
              title="Pro Tag (Label)"
              description={`${tagBuckets.length} Tag${tagBuckets.length === 1 ? "" : "s"}`}
            />
            {tagBuckets.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-3)]">Keine Daten.</p>
            ) : (
              <ul className="space-y-1">
                {tagBuckets.map((bucket) => {
                  const tag = tagMap.get(bucket.tagId);
                  if (!tag) return null;
                  const pct = totalSec > 0 ? Math.round((bucket.durationSec / totalSec) * 100) : 0;
                  return (
                    <li key={bucket.tagId} className="flex items-center gap-3 py-1.5">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--color-text-1)]">
                        {tag.name}
                      </span>
                      <span className="tnum text-xs text-[color:var(--color-text-3)]">{pct}%</span>
                      <span className="tnum text-xs font-medium text-[color:var(--color-text-2)]">
                        {formatDecimalHours(bucket.durationSec, settings.locale)} h
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </Gated>
      </div>

      {features.billing && projectBuckets.some((b) => b.amount > 0) && (
        <Card padding="md">
          <CardHeader title="Abrechenbar pro Projekt" />
          <ul className="divide-y divide-[color:var(--color-border-subtle)]">
            {projectBuckets
              .filter((b) => b.amount > 0)
              .map((b) => (
                <li
                  key={b.projectId ?? "none"}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-[color:var(--color-text-1)]">
                    {b.projectName}
                  </span>
                  <span className="tnum font-medium text-[color:var(--color-success-600)] dark:text-[color:var(--color-success-500)]">
                    {formatMoney(b.amount, b.currency ?? settings.currency, settings.locale)}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
