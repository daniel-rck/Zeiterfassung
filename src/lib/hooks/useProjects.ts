import { useCallback, useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { listProjects } from "../db/projects";
import type { Project } from "../types";

export interface UseProjectsOptions {
  includeArchived?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}): {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { includeArchived } = options;

  const reload = useCallback(async () => {
    try {
      const data = await listProjects({ includeArchived });
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribe((message) => {
      if (
        message.type === "project-changed" ||
        message.type === "project-deleted" ||
        message.type === "db-cleared"
      ) {
        void reload();
      }
    });
    return unsubscribe;
  }, [reload]);

  return { projects, loading, error, reload };
}
