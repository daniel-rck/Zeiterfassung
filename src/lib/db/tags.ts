import { newId } from "../ids";
import type { Tag } from "../types";
import { getDB, notifyMutation } from "./db";

export type NewTag = Omit<Tag, "id" | "createdAt" | "updatedAt">;

export async function createTag(input: NewTag): Promise<Tag> {
  const now = Date.now();
  const tag: Tag = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  await db.add("tags", tag);
  notifyMutation("tags");
  return tag;
}

export async function updateTag(
  id: string,
  patch: Partial<Omit<Tag, "id" | "createdAt">>,
): Promise<Tag> {
  const db = await getDB();
  const existing = await db.get("tags", id);
  if (!existing) throw new Error(`Tag ${id} nicht gefunden`);
  const updated: Tag = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  await db.put("tags", updated);
  notifyMutation("tags");
  return updated;
}

export async function getTag(id: string): Promise<Tag | undefined> {
  const db = await getDB();
  return db.get("tags", id);
}

export async function listTags(options?: { includeArchived?: boolean }): Promise<Tag[]> {
  const db = await getDB();
  const all = await db.getAll("tags");
  const filtered = options?.includeArchived ? all : all.filter((t) => !t.archived);
  return filtered.sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export async function countEntriesForTag(id: string): Promise<number> {
  const db = await getDB();
  const all = await db.getAll("time_entries");
  return all.filter((e) => e.tagIds.includes(id)).length;
}

export interface DeleteTagResult {
  cleaned: number;
}

// Delete a tag and strip its id from every referencing entry in one
// transaction. The user-facing copy already promises this — without the
// cleanup, entries would point at a phantom tag.
export async function deleteTag(id: string): Promise<DeleteTagResult> {
  const db = await getDB();
  const tx = db.transaction(["tags", "time_entries"], "readwrite");
  await tx.objectStore("tags").delete(id);
  const all = await tx.objectStore("time_entries").getAll();
  const linked = all.filter((e) => e.tagIds.includes(id));
  for (const entry of linked) {
    await tx.objectStore("time_entries").put({
      ...entry,
      tagIds: entry.tagIds.filter((tid) => tid !== id),
    });
  }
  await tx.done;
  notifyMutation("tags");
  if (linked.length > 0) notifyMutation("time_entries");
  return { cleaned: linked.length };
}

export async function archiveTag(id: string): Promise<void> {
  await updateTag(id, { archived: true });
}

export async function restoreTag(id: string): Promise<void> {
  await updateTag(id, { archived: false });
}
