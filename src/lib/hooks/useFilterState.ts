import { useCallback, useEffect, useState } from "react";

const PREFIX = "zeiterfassung:filter:";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) } as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore quota errors — filters are non-essential state
  }
}

export function useFilterState<T extends object>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => read(key, initial));

  useEffect(() => {
    write(key, state);
  }, [key, state]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [state, update];
}
