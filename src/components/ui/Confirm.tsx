import { AlertTriangle } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "./Button";

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      pending?.resolve(result);
      setPending(null);
    },
    [pending],
  );

  const panelRef = useRef<HTMLDivElement>(null);

  // Remember the opener once per dialog, not per `close` identity change.
  const isOpen = pending != null;
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Capture phase + preventDefault: a Sheet behind the dialog checks
        // `defaultPrevented` and stays open.
        e.preventDefault();
        close(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panelRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = "";
    };
  }, [pending, close]);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="page-fade relative z-10 w-full max-w-md rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5 shadow-md"
          >
            <div className="flex items-start gap-3">
              {pending.options.tone === "danger" && (
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--color-danger-500)]/10 text-[color:var(--color-danger-500)]">
                  <AlertTriangle size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-title"
                  className="text-sm font-semibold text-[color:var(--color-text-1)]"
                >
                  {pending.options.title}
                </h2>
                {pending.options.description && (
                  <div className="mt-1.5 text-sm text-[color:var(--color-text-2)]">
                    {pending.options.description}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              {/* Destructive dialogs start on "Abbrechen" so a reflexive Enter
                  doesn't delete anything. */}
              <Button
                autoFocus={pending.options.tone === "danger"}
                variant="ghost"
                onClick={() => close(false)}
              >
                {pending.options.cancelLabel ?? "Abbrechen"}
              </Button>
              <Button
                autoFocus={pending.options.tone !== "danger"}
                variant={pending.options.tone === "danger" ? "danger" : "primary"}
                onClick={() => close(true)}
              >
                {pending.options.confirmLabel ?? "Bestätigen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
