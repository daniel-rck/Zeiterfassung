import { useLiveQuery } from "../db";
import { type ListEntriesFilter, listEntries } from "../db/timeEntries";
import type { TimeEntry } from "../types";

export function useEntries(filter: ListEntriesFilter = {}): {
  entries: TimeEntry[];
  loading: boolean;
  error: Error | null;
} {
  const { from, to, projectId, billable, includeRunning } = filter;
  const tagIdsKey = filter.tagIds?.join(",") ?? "";

  const { data, loading, error } = useLiveQuery(
    "time_entries",
    () =>
      listEntries({
        from,
        to,
        projectId,
        billable,
        includeRunning,
        tagIds: tagIdsKey ? tagIdsKey.split(",") : undefined,
      }),
    [from, to, projectId, billable, includeRunning, tagIdsKey],
  );

  return { entries: data ?? [], loading, error: error ?? null };
}
