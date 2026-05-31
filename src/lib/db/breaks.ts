import { newId } from "../ids";
import type { Break } from "../types";
import { broadcast } from "./broadcast";
import { getDB } from "./index";

export async function startBreak(entryId: string): Promise<Break> {
  const db = await getDB();
  const tx = db.transaction("breaks", "readwrite");
  const store = tx.objectStore("breaks");
  const existing = await store.index("byEntryId").getAll(entryId);
  const running = existing.find((b) => b.endedAt == null);
  if (running) {
    await tx.done;
    return running;
  }
  const now = Date.now();
  const value: Break = {
    id: newId(),
    entryId,
    startedAt: now,
    durationSec: 0,
    createdAt: now,
    updatedAt: now,
  };
  await store.add(value);
  await tx.done;
  broadcast({ type: "breaks-changed" });
  return value;
}

export async function endBreak(breakId: string): Promise<Break | null> {
  const db = await getDB();
  const tx = db.transaction("breaks", "readwrite");
  const store = tx.objectStore("breaks");
  const existing = await store.get(breakId);
  if (!existing || existing.endedAt != null) {
    await tx.done;
    return existing ?? null;
  }
  const now = Date.now();
  const updated: Break = {
    ...existing,
    endedAt: now,
    durationSec: Math.max(0, Math.round((now - existing.startedAt) / 1000)),
    updatedAt: now,
  };
  await store.put(updated);
  await tx.done;
  broadcast({ type: "breaks-changed" });
  return updated;
}

export async function endRunningBreakFor(entryId: string): Promise<Break | null> {
  const db = await getDB();
  const tx = db.transaction("breaks", "readwrite");
  const store = tx.objectStore("breaks");
  const all = await store.index("byEntryId").getAll(entryId);
  const running = all.find((b) => b.endedAt == null);
  if (!running) {
    await tx.done;
    return null;
  }
  const now = Date.now();
  const updated: Break = {
    ...running,
    endedAt: now,
    durationSec: Math.max(0, Math.round((now - running.startedAt) / 1000)),
    updatedAt: now,
  };
  await store.put(updated);
  await tx.done;
  broadcast({ type: "breaks-changed" });
  return updated;
}

export async function listBreaksByEntry(entryId: string): Promise<Break[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("breaks", "byEntryId", entryId);
  return all.sort((a, b) => a.startedAt - b.startedAt);
}

export async function deleteBreak(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("breaks", id);
  broadcast({ type: "breaks-changed" });
}

export async function listBreaksInRange(from: number, to: number): Promise<Break[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("breaks", "byStartedAt", IDBKeyRange.bound(from, to));
  return all;
}
