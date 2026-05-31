import { useEffect } from "react";

export type ShortcutHandler = () => void;

export interface ShortcutBinding {
  key: string; // e.g. ' ', 'n', '?'
  description: string;
  handler: ShortcutHandler;
  preventDefault?: boolean;
}

function isFromInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useShortcuts(bindings: ShortcutBinding[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isFromInput(event.target)) return;
      const match = bindings.find((b) => b.key === event.key);
      if (!match) return;
      if (match.preventDefault !== false) {
        event.preventDefault();
      }
      match.handler();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindings, enabled]);
}
