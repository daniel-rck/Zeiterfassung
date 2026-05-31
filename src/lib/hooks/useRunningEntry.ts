import { useEffect, useState } from "react";
import { useLiveQuery } from "../db";
import { getRunningEntry } from "../db/timeEntries";
import type { TimeEntry } from "../types";

export function useRunningEntry(): {
  entry: TimeEntry | null;
  liveDurationSec: number;
  loading: boolean;
} {
  const { data, loading } = useLiveQuery("time_entries", getRunningEntry, []);
  const entry = data ?? null;
  const [liveDurationSec, setLiveDurationSec] = useState(0);

  const entryStartedAt = entry?.startedAt;
  useEffect(() => {
    if (entryStartedAt == null) {
      setLiveDurationSec(0);
      return;
    }
    const update = () => {
      setLiveDurationSec(Math.max(0, Math.round((Date.now() - entryStartedAt) / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
    // Keyed on the running entry's id + start time so reload-driven object
    // identity changes (broadcasts) don't tear down and rebuild the 1s tick.
  }, [entry?.id, entryStartedAt]);

  return { entry, liveDurationSec, loading };
}
