import { useCallback, useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { readSettings } from "../db/settings";
import type { Settings } from "../types";

export function useSettings(): {
  settings: Settings;
  reload: () => void;
} {
  const [settings, setSettings] = useState<Settings>(() => readSettings());

  const reload = useCallback(() => {
    setSettings(readSettings());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === "settings-changed" || message.type === "db-cleared") {
        reload();
      }
    });
    return unsubscribe;
  }, [reload]);

  return { settings, reload };
}
