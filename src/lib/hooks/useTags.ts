import { useCallback, useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { listTags } from "../db/tags";
import type { Tag } from "../types";

export function useTags(options: { includeArchived?: boolean } = {}): {
  tags: Tag[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { includeArchived } = options;

  const reload = useCallback(async () => {
    try {
      const data = await listTags({ includeArchived });
      setTags(data);
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
        message.type === "tag-changed" ||
        message.type === "tag-deleted" ||
        message.type === "db-cleared"
      ) {
        void reload();
      }
    });
    return unsubscribe;
  }, [reload]);

  return { tags, loading, error, reload };
}
