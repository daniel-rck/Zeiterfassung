import { useLiveQuery } from "../db";
import { listTags } from "../db/tags";
import type { Tag } from "../types";

export function useTags(options: { includeArchived?: boolean } = {}): {
  tags: Tag[];
  loading: boolean;
  error: Error | null;
} {
  const { includeArchived } = options;
  const { data, loading, error } = useLiveQuery("tags", () => listTags({ includeArchived }), [
    includeArchived,
  ]);
  return { tags: data ?? [], loading, error: error ?? null };
}
