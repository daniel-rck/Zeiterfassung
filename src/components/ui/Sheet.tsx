import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({
  open,
  onClose,
  title,
  children,
  closeable = true,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  closeable?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Callers pass inline arrows, so `onClose` changes identity on every render.
  // Keeping it out of the effect's deps stops the effect from re-running per
  // keystroke — which used to restore focus behind the dialog and then move it
  // to the header close button while the user was typing.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Respect a field that already took focus (React `autoFocus` runs before
    // effects); otherwise start at the first control in the body rather than
    // the header close button.
    if (!dialogRef.current?.contains(document.activeElement)) {
      const bodyFirst = Array.from(
        bodyRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).find((el) => el.offsetParent !== null);
      const target = bodyFirst ?? focusables()[0];
      if (target) {
        target.focus();
      } else {
        dialogRef.current?.focus();
      }
    }

    const handler = (e: KeyboardEvent) => {
      // A nested popup (combobox, palette) that handled Escape itself marks
      // the event; don't close the sheet underneath as well.
      if (e.key === "Escape" && closeable && !e.defaultPrevented) {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, closeable]);

  if (!open) return null;

  const sizeClass = {
    sm: "sm:max-w-md",
    md: "sm:max-w-2xl",
    lg: "sm:max-w-4xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => closeable && onClose()}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] shadow-md outline-none sm:max-h-[85vh] sm:rounded-lg ${sizeClass}`}
      >
        {(title || closeable) && (
          <div className="flex items-center justify-between border-b border-[color:var(--color-border-subtle)] px-5 py-1.5">
            <div id={titleId} className="text-sm font-semibold text-[color:var(--color-text-1)]">
              {title}
            </div>
            {closeable && (
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-[color:var(--color-text-3)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)] no-min-tap"
                aria-label="Schließen"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
