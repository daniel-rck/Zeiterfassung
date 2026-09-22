import { newId } from "../ids";
import type { Break, TimeEntry } from "../types";
import { endRunningBreakFor } from "./breaks";
import { dayKey, getDB, notifyMutation, type StoredTimeEntry } from "./db";
import { getProject } from "./projects";

export type NewTimeEntry = Omit<TimeEntry, "id" | "createdAt" | "updatedAt" | "durationSec"> & {
  durationSec?: number;
};

function toStored(entry: TimeEntry): StoredTimeEntry {
  return {
    ...entry,
    startedAtDay: dayKey(entry.startedAt),
    running: entry.endedAt == null ? 1 : 0,
  };
}

function fromStored(stored: StoredTimeEntry): TimeEntry {
  // Strip derived fields
  const { startedAtDay: _d, running: _r, ...rest } = stored;
  void _d;
  void _r;
  return rest;
}

function calcDuration(startedAt: number, endedAt?: number, fallback = 0): number {
  if (endedAt == null) return fallback;
  return Math.max(0, Math.round((endedAt - startedAt) / 1000));
}

// Gross span minus finished breaks.
function netDuration(startedAt: number, endedAt: number, breaks: Break[]): number {
  const breakSec = breaks.reduce((s, b) => s + (b.endedAt ? b.durationSec : 0), 0);
  return Math.max(0, calcDuration(startedAt, endedAt) - breakSec);
}

export interface StartTimerInput {
  projectId?: string;
  description?: string;
  billable?: boolean;
  tagIds?: string[];
  notes?: string;
}

export async function startTimer(input: StartTimerInput = {}): Promise<TimeEntry> {
  let billable = input.billable;
  let hourlyRate: number | undefined;
  let currency: string | undefined;
  if (input.projectId) {
    const project = await getProject(input.projectId);
    if (project) {
      billable = billable ?? project.billableDefault;
      hourlyRate = project.hourlyRate;
      currency = project.currency;
    }
  }
  const now = Date.now();
  const entry: TimeEntry = {
    id: newId(),
    projectId: input.projectId,
    description: input.description ?? "",
    startedAt: now,
    endedAt: undefined,
    durationSec: 0,
    billable: billable ?? false,
    tagIds: input.tagIds ?? [],
    notes: input.notes,
    hourlyRateSnapshot: hourlyRate,
    currencySnapshot: currency,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  // Check-and-add inside one readwrite transaction: IndexedDB serializes
  // readwrite transactions on the store, so two tabs starting simultaneously
  // cannot both pass the running-check (a split check would let them).
  const tx = db.transaction("time_entries", "readwrite");
  const running = await tx.store.index("byRunning").get(1);
  if (running) {
    await tx.done;
    throw new Error("Es läuft bereits ein Timer.");
  }
  await tx.store.add(toStored(entry));
  await tx.done;
  notifyMutation("time_entries");
  return entry;
}

export async function stopTimer(): Promise<TimeEntry | null> {
  const running = await getRunningEntry();
  if (!running) return null;
  // A break that is still open would otherwise stay running forever and its
  // time would count as work — every stop path (hero button, Space shortcut,
  // command palette) must settle it first.
  await endRunningBreakFor(running.id);
  const db = await getDB();
  // Re-read inside one readwrite transaction so a concurrent edit (description
  // blur, another tab) between the lookup above and this write isn't lost, and
  // a stop that already happened elsewhere isn't applied twice.
  const tx = db.transaction(["time_entries", "breaks"], "readwrite");
  const current = await tx.objectStore("time_entries").get(running.id);
  if (!current || current.endedAt != null) {
    await tx.done;
    return current ? fromStored(current) : null;
  }
  const breaks = await tx.objectStore("breaks").index("byEntryId").getAll(running.id);
  const now = Date.now();
  const updated: TimeEntry = {
    ...fromStored(current),
    endedAt: now,
    durationSec: netDuration(current.startedAt, now, breaks),
    updatedAt: now,
  };
  await tx.objectStore("time_entries").put(toStored(updated));
  await tx.done;
  notifyMutation("time_entries");
  return updated;
}

export async function getRunningEntry(): Promise<TimeEntry | undefined> {
  const db = await getDB();
  const stored = await db.getFromIndex("time_entries", "byRunning", 1);
  return stored ? fromStored(stored) : undefined;
}

export async function createEntry(input: NewTimeEntry): Promise<TimeEntry> {
  const now = Date.now();
  const duration = input.durationSec ?? calcDuration(input.startedAt, input.endedAt, 0);
  const entry: TimeEntry = {
    ...input,
    id: newId(),
    durationSec: duration,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  await db.add("time_entries", toStored(entry));
  notifyMutation("time_entries");
  return entry;
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<TimeEntry, "id" | "createdAt">>,
): Promise<TimeEntry> {
  const db = await getDB();
  // Resolve the project outside the transaction: awaiting unrelated work
  // inside it would let IndexedDB auto-commit the transaction.
  const project =
    "projectId" in patch && patch.projectId ? await getProject(patch.projectId) : undefined;
  // Read-merge-write in one readwrite transaction. A split get/put lets a
  // stale snapshot (e.g. a description saved while another tab stops the
  // timer) overwrite the newer record and silently undo the stop.
  const tx = db.transaction(["time_entries", "breaks"], "readwrite");
  const store = tx.objectStore("time_entries");
  const existing = await store.get(id);
  if (!existing) {
    await tx.done;
    throw new Error(`Eintrag ${id} nicht gefunden`);
  }
  const base = fromStored(existing);
  const merged: TimeEntry = {
    ...base,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  // Only an explicit `endedAt` key may change the end; a patch that merely
  // omits it keeps whatever is stored now (including a concurrent stop).
  if (!("endedAt" in patch)) merged.endedAt = base.endedAt;
  if ("projectId" in patch && patch.projectId !== base.projectId) {
    merged.hourlyRateSnapshot = project?.hourlyRate;
    merged.currencySnapshot = project?.currency;
  }
  if (patch.durationSec != null) {
    merged.durationSec = patch.durationSec;
  } else if ("startedAt" in patch || "endedAt" in patch) {
    if (merged.endedAt == null) {
      merged.durationSec = 0;
    } else {
      const breaks = await tx.objectStore("breaks").index("byEntryId").getAll(id);
      merged.durationSec = netDuration(merged.startedAt, merged.endedAt, breaks);
    }
  }
  await store.put(toStored(merged));
  await tx.done;
  notifyMutation("time_entries");
  return merged;
}

export async function getEntry(id: string): Promise<TimeEntry | undefined> {
  const db = await getDB();
  const stored = await db.get("time_entries", id);
  return stored ? fromStored(stored) : undefined;
}

export interface ListEntriesFilter {
  from?: number;
  to?: number;
  projectId?: string | null; // null = ohne Projekt
  billable?: boolean;
  tagIds?: string[];
  includeRunning?: boolean;
}

export async function listEntries(filter: ListEntriesFilter = {}): Promise<TimeEntry[]> {
  const db = await getDB();
  const all = await db.getAll("time_entries");
  let result = all.map(fromStored);
  // Range filter: a finished entry belongs to the range it *starts* in — the
  // same rule `groupByDay` uses (`dayKey(startedAt)`). Filtering finished
  // entries by overlap counted one spanning midnight (or a week boundary) in
  // both ranges. A running entry stays visible in every range it overlaps
  // (its durationSec is 0, so it can't be double-counted).
  const { from, to } = filter;
  if (from != null) {
    result = result.filter((e) => (e.endedAt == null ? true : e.startedAt >= from));
  }
  if (to != null) {
    result = result.filter((e) => e.startedAt <= to);
  }
  if (filter.projectId === null) {
    result = result.filter((e) => !e.projectId);
  } else if (filter.projectId) {
    result = result.filter((e) => e.projectId === filter.projectId);
  }
  if (filter.billable != null) {
    result = result.filter((e) => e.billable === filter.billable);
  }
  if (filter.tagIds && filter.tagIds.length > 0) {
    const wanted = new Set(filter.tagIds);
    result = result.filter((e) => e.tagIds.some((t) => wanted.has(t)));
  }
  if (!filter.includeRunning) {
    result = result.filter((e) => e.endedAt != null);
  }
  return result.sort((a, b) => b.startedAt - a.startedAt);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("time_entries", id);
  notifyMutation("time_entries");
}

// Re-insert an entry snapshot under its original id. Used by undo-toasts.
export async function restoreEntry(entry: TimeEntry): Promise<TimeEntry> {
  const db = await getDB();
  await db.put("time_entries", toStored(entry));
  notifyMutation("time_entries");
  return entry;
}
