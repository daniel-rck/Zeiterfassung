import { useLiveQuery } from "../db";
import { readSettings } from "../db/settings";
import type { Settings } from "../types";

export function useSettings(): {
  settings: Settings;
} {
  const { data } = useLiveQuery("settings", () => Promise.resolve(readSettings()), []);
  return { settings: data ?? readSettings() };
}
