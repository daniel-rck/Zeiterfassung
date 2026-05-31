import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
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
import { newId } from "../../lib/ids";

type Tone = "info" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  tone?: Tone;
  duration?: number;
  action?: ToastAction;
}

interface ToastItem {
  id: string;
  message: string;
  tone: Tone;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, "tone">) => void;
  error: (message: string, options?: Omit<ToastOptions, "tone">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<Tone, number> = {
  info: 3500,
  success: 3500,
  error: 6000,
};

const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = newId();
    const tone: Tone = options.tone ?? "info";
    const duration = options.duration ?? DEFAULT_DURATION[tone];
    setItems((current) =>
      [...current, { id, message, tone, duration, action: options.action }].slice(-MAX_VISIBLE),
    );
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m, o) => show(m, { ...o, tone: "success" }),
      error: (m, o) => show(m, { ...o, tone: "error" }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-label="Benachrichtigungen"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0"
      >
        {items.map((item) => (
          <ToastEntry key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

function ToastEntry({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const startedAt = useRef(Date.now());
  const remaining = useRef(item.duration);
  const dismiss = () => onDismiss(item.id);

  useEffect(() => {
    if (paused) {
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
      return;
    }
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(item.id), remaining.current);
    return () => clearTimeout(timer);
    // `onDismiss` is stable (useCallback) and `item.id` is constant for this
    // toast, so this effect only re-runs on pause/resume — adding another toast
    // no longer restarts this one's auto-dismiss timer.
  }, [paused, onDismiss, item.id]);

  const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? AlertCircle : Info;
  const iconColor =
    item.tone === "success"
      ? "text-[color:var(--color-success-500)]"
      : item.tone === "error"
        ? "text-[color:var(--color-danger-500)]"
        : "text-brand-500";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: status/alert region pauses auto-dismiss on hover/focus, no click affordance
    <div
      className="page-fade pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-3.5 py-3 shadow-md"
      role={item.tone === "error" ? "alert" : "status"}
      aria-live={item.tone === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon className={`mt-0.5 flex-shrink-0 ${iconColor}`} size={16} />
      <div className="min-w-0 flex-1 text-sm text-[color:var(--color-text-1)]">{item.message}</div>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            dismiss();
          }}
          className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40 no-min-tap"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Schließen"
        className="flex-shrink-0 rounded p-0.5 text-[color:var(--color-text-3)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)] no-min-tap"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
