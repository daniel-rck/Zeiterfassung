import { useLiveQuery } from "../db";
import { listProjects } from "../db/projects";
import type { Project } from "../types";

export interface UseProjectsOptions {
  includeArchived?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}): {
  projects: Project[];
  loading: boolean;
  error: Error | null;
} {
  const { includeArchived } = options;
  const { data, loading, error } = useLiveQuery(
    "projects",
    () => listProjects({ includeArchived }),
    [includeArchived],
  );
  return { projects: data ?? [], loading, error: error ?? null };
}
