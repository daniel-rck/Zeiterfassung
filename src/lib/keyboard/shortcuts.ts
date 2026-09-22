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

// Space/Enter on a focused control must activate that control, not toggle
// the timer behind it.
function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.closest(
      'button, a[href], summary, [role="button"], [role="switch"], [role="tab"], [role="checkbox"], [role="option"], [role="menuitem"]',
    ) != null
  );
}

// While a modal is open, page-level shortcuts (navigation, timer) would act on
// the page behind it and discard whatever the user is editing.
function isModalOpen(): boolean {
  return document.querySelector('[aria-modal="true"]') != null;
}

export function useShortcuts(bindings: ShortcutBinding[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat) return;
      if (isFromInput(event.target)) return;
      if (event.key === " " && isActivatable(event.target)) return;
      if (isModalOpen()) return;
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
