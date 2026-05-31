import { useCallback, useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { type ListEntriesFilter, listEntries } from "../db/timeEntries";
import type { TimeEntry } from "../types";

export function useEntries(filter: ListEntriesFilter = {}): {
  entries: TimeEntry[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { from, to, projectId, billable, includeRunning } = filter;
  const tagIdsKey = filter.tagIds?.join(",") ?? "";

  const reload = useCallback(async () => {
    try {
      const data = await listEntries({
        from,
        to,
        projectId,
        billable,
        includeRunning,
        tagIds: tagIdsKey ? tagIdsKey.split(",") : undefined,
      });
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [from, to, projectId, billable, includeRunning, tagIdsKey]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribe((message) => {
      if (
        message.type === "entry-changed" ||
        message.type === "entry-deleted" ||
        message.type === "timer-started" ||
        message.type === "timer-stopped" ||
        message.type === "db-cleared"
      ) {
        void reload();
      }
    });
    return unsubscribe;
  }, [reload]);

  return { entries, loading, error, reload };
}
