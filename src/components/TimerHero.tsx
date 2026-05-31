import { Coffee, Play, PlayCircle, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { endRunningBreakFor, startBreak } from "../lib/db/breaks";
import { startTimer, stopTimer, updateEntry } from "../lib/db/timeEntries";
import { formatDuration, formatTime } from "../lib/format";
import { useBreaksForEntry } from "../lib/hooks/useBreaks";
import { useFeature } from "../lib/hooks/useFeature";
import { useProjects } from "../lib/hooks/useProjects";
import { useRunningEntry } from "../lib/hooks/useRunningEntry";
import { useSettings } from "../lib/hooks/useSettings";
import { Gated } from "./Gated";
import { Button } from "./ui/Button";
import { Combobox, type ComboOption } from "./ui/Combobox";
import { useToast } from "./ui/Toast";

export function TimerHero() {
  const { entry, liveDurationSec } = useRunningEntry();
  const { projects } = useProjects();
  const { settings } = useSettings();
  const toast = useToast();
  const breaksOn = useFeature("breaks");
  const { runningBreak, totalSec: breakTotalSec, liveBreakSec } = useBreaksForEntry(entry?.id);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [savedFlash, setSavedFlash] = useState(false);
  const syncedEntryId = useRef<string | undefined>(undefined);

  // Sync the local fields from the running entry only when a *different* entry
  // becomes active. Re-syncing on every `entry` object identity (which changes
  // on each reload/broadcast tick) would clobber text the user is currently
  // typing but has not yet persisted.
  useEffect(() => {
    if (entry && entry.id !== syncedEntryId.current) {
      setDescription(entry.description);
      setProjectId(entry.projectId);
      syncedEntryId.current = entry.id;
    } else if (!entry) {
      syncedEntryId.current = undefined;
    }
  }, [entry]);

  const projectOptions: ComboOption[] = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.client,
        color: p.color,
      })),
    [projects],
  );

  const handleStart = async () => {
    try {
      await startTimer({
        description: description.trim(),
        projectId,
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleStop = async () => {
    try {
      if (entry) {
        await endRunningBreakFor(entry.id);
      }
      const stopped = await stopTimer();
      if (stopped) {
        toast.success(`Eintrag gestoppt: ${formatDuration(stopped.durationSec, "long")}`);
      }
      setDescription("");
      setProjectId(undefined);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleToggleBreak = async () => {
    if (!entry) return;
    try {
      if (runningBreak) {
        await endRunningBreakFor(entry.id);
        toast.success("Pause beendet");
      } else {
        await startBreak(entry.id);
        toast.success("Pause läuft");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const persistDescription = async () => {
    if (!entry) return;
    if (description === entry.description) return;
    try {
      await updateEntry(entry.id, { description });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const persistProject = async (next: string | undefined) => {
    setProjectId(next);
    if (!entry) return;
    try {
      await updateEntry(entry.id, { projectId: next });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const liveMinutes = Math.floor(liveDurationSec / 60);
  const announcement = useMemo(() => {
    if (!entry) return "";
    const hours = Math.floor(liveMinutes / 60);
    const rem = liveMinutes % 60;
    if (hours === 0 && liveMinutes === 0) return "Timer läuft.";
    if (hours === 0) return `Timer läuft, ${liveMinutes} Minuten.`;
    if (rem === 0) return `Timer läuft, ${hours} Stunden.`;
    return `Timer läuft, ${hours} Stunden ${rem} Minuten.`;
  }, [entry, liveMinutes]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5 sm:p-6 ${
        entry ? "shadow-sm" : ""
      }`}
    >
      {entry && (
        <span
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-brand-500/15 blur-3xl"
        />
      )}

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--color-text-3)]">
            {entry ? (
              <>
                <span
                  aria-hidden="true"
                  className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-500"
                />
                <span>läuft seit {formatTime(entry.startedAt, settings.locale)}</span>
              </>
            ) : (
              <span>Bereit</span>
            )}
            {savedFlash && (
              <span className="ml-auto text-[color:var(--color-success-600)]">Gespeichert</span>
            )}
          </div>
          <div
            className={`tnum mt-1 font-mono font-semibold leading-none tracking-[-0.04em] ${
              entry ? "text-[color:var(--color-text-1)]" : "text-[color:var(--color-text-3)]"
            }`}
            style={{ fontSize: "clamp(2.5rem, 7vw, 3.5rem)" }}
          >
            {formatDuration(entry ? liveDurationSec : 0, "short")}
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
            {runningBreak ? ` Pause läuft seit ${Math.floor(liveBreakSec / 60)} Minuten.` : ""}
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void persistDescription()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !entry) {
                e.preventDefault();
                void handleStart();
              }
            }}
            placeholder={entry ? "Beschreibung…" : "Was machst du gerade?"}
            className="mt-4 w-full border-b border-[color:var(--color-border-subtle)] bg-transparent py-2 text-base text-[color:var(--color-text-1)] placeholder:text-[color:var(--color-text-3)] focus:border-brand-500 focus:outline-none transition-colors duration-150"
          />
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {entry && breaksOn && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => void handleToggleBreak()}
              icon={runningBreak ? <PlayCircle size={16} /> : <Coffee size={16} />}
            >
              {runningBreak ? `Weiter (${formatDuration(liveBreakSec, "short")})` : "Pause"}
            </Button>
          )}
          <Button
            variant={entry ? "danger" : "primary"}
            size="lg"
            onClick={() => (entry ? void handleStop() : void handleStart())}
            icon={
              entry ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )
            }
            aria-label={entry ? "Timer stoppen" : "Timer starten"}
          >
            {entry ? "Stop" : "Start"}
          </Button>
        </div>
      </div>

      <Gated feature="projects">
        <div className="relative mt-4 flex items-center gap-3 border-t border-[color:var(--color-border-subtle)] pt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-3)]">
            Projekt
          </span>
          <div className="min-w-0 flex-1">
            <Combobox
              options={projectOptions}
              value={projectId}
              onChange={(next) => void persistProject(next)}
              placeholder="Ohne Projekt"
              clearLabel="Ohne Projekt"
              variant="ghost"
              size="sm"
              ariaLabel="Projekt wählen"
            />
          </div>
        </div>
      </Gated>

      {entry && breaksOn && breakTotalSec > 0 && (
        <div className="relative mt-2 flex items-center gap-1.5 text-xs text-[color:var(--color-warn-600)] dark:text-[color:var(--color-warn-500)]">
          <Coffee size={12} />
          <span className="tnum font-mono">{formatDuration(breakTotalSec, "short")} Pause</span>
        </div>
      )}
    </div>
  );
}
