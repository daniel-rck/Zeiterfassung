import { useCallback, useEffect, useState } from "react";
import { listBreaksByEntry } from "../db/breaks";
import { subscribe } from "../db/broadcast";
import type { Break } from "../types";

export function useBreaksForEntry(entryId: string | undefined): {
  breaks: Break[];
  runningBreak: Break | null;
  totalSec: number;
  liveBreakSec: number;
  reload: () => Promise<void>;
} {
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [liveBreakSec, setLiveBreakSec] = useState(0);

  const reload = useCallback(async () => {
    if (!entryId) {
      setBreaks([]);
      return;
    }
    const all = await listBreaksByEntry(entryId);
    setBreaks(all);
  }, [entryId]);

  useEffect(() => {
    void reload();
    const unsub = subscribe((m) => {
      if (m.type === "breaks-changed" || m.type === "db-cleared") void reload();
    });
    return unsub;
  }, [reload]);

  const runningBreak = breaks.find((b) => b.endedAt == null) ?? null;

  useEffect(() => {
    if (!runningBreak) {
      setLiveBreakSec(0);
      return;
    }
    const update = () => {
      setLiveBreakSec(Math.max(0, Math.round((Date.now() - runningBreak.startedAt) / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [runningBreak]);

  const totalSec = breaks.reduce((s, b) => s + (b.endedAt ? b.durationSec : 0), 0) + liveBreakSec;

  return { breaks, runningBreak, totalSec, liveBreakSec, reload };
}
