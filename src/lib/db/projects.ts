import { newId } from "../ids";
import type { Project } from "../types";
import { broadcast } from "./broadcast";
import { getDB } from "./index";

export type NewProject = Omit<Project, "id" | "createdAt" | "updatedAt">;

export async function createProject(input: NewProject): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  await db.add("projects", project);
  broadcast({ type: "project-changed", id: project.id });
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt">>,
): Promise<Project> {
  const db = await getDB();
  const existing = await db.get("projects", id);
  if (!existing) throw new Error(`Projekt ${id} nicht gefunden`);
  const updated: Project = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  await db.put("projects", updated);
  broadcast({ type: "project-changed", id });
  return updated;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get("projects", id);
}

export async function listProjects(options?: { includeArchived?: boolean }): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll("projects");
  const filtered = options?.includeArchived ? all : all.filter((p) => !p.archived);
  return filtered.sort((a, b) => a.name.localeCompare(b.name, "de"));
}

// Count of time entries currently referencing this project. Used by UI to
// warn before delete.
export async function countEntriesForProject(id: string): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("time_entries", "byProjectId", id);
}

export interface DeleteProjectResult {
  cleaned: number;
}

// Delete a project and unlink it from all referencing entries in a single
// transaction so no entry is left with a dangling projectId.
export async function deleteProject(id: string): Promise<DeleteProjectResult> {
  const db = await getDB();
  const tx = db.transaction(["projects", "time_entries"], "readwrite");
  await tx.objectStore("projects").delete(id);
  const entriesIndex = tx.objectStore("time_entries").index("byProjectId");
  const linked = await entriesIndex.getAll(id);
  for (const entry of linked) {
    const { projectId: _drop, ...rest } = entry;
    void _drop;
    await tx.objectStore("time_entries").put(rest as typeof entry);
  }
  await tx.done;
  broadcast({ type: "project-deleted", id });
  for (const entry of linked) {
    broadcast({ type: "entry-changed", id: entry.id });
  }
  return { cleaned: linked.length };
}

export async function archiveProject(id: string): Promise<void> {
  await updateProject(id, { archived: true });
}

export async function restoreProject(id: string): Promise<void> {
  await updateProject(id, { archived: false });
}
