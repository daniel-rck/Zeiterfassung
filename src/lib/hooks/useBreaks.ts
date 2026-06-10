import { useEffect, useState } from "react";
import { useLiveQuery } from "../db";
import { listBreaksByEntry } from "../db/breaks";
import type { Break } from "../types";

export function useBreaksForEntry(entryId: string | undefined): {
  breaks: Break[];
  runningBreak: Break | null;
  totalSec: number;
  liveBreakSec: number;
} {
  const { data } = useLiveQuery(
    "breaks",
    () => (entryId ? listBreaksByEntry(entryId) : Promise.resolve<Break[]>([])),
    [entryId],
  );
  const breaks = data ?? [];
  const [liveBreakSec, setLiveBreakSec] = useState(0);

  const runningBreak = breaks.find((b) => b.endedAt == null) ?? null;

  const runningStartedAt = runningBreak?.startedAt;
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the break id so reload-driven object identity changes don't rebuild the 1s tick
  useEffect(() => {
    if (runningStartedAt == null) {
      setLiveBreakSec(0);
      return;
    }
    const update = () => {
      setLiveBreakSec(Math.max(0, Math.round((Date.now() - runningStartedAt) / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [runningBreak?.id, runningStartedAt]);

  const totalSec = breaks.reduce((s, b) => s + (b.endedAt ? b.durationSec : 0), 0) + liveBreakSec;

  return { breaks, runningBreak, totalSec, liveBreakSec };
}
