import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";

const FIELD_BASE =
  "w-full rounded-md border bg-[color:var(--color-surface-1)] px-3 py-2 text-sm text-[color:var(--color-text-1)] placeholder:text-[color:var(--color-text-3)] outline-none transition-colors duration-150 ease-out disabled:opacity-60 disabled:cursor-not-allowed";

const FIELD_DEFAULT =
  "border-[color:var(--color-border-strong)] hover:border-[color:var(--color-text-3)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

const FIELD_ERROR =
  "border-[color:var(--color-danger-500)] focus:ring-2 focus:ring-[color:var(--color-danger-500)]/25";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  required,
  group = false,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  /** For button groups (swatches, chips): a `<label>` would forward every click
   *  on its caption or gaps to the first button inside, so render a
   *  `<fieldset>` with a `<legend>` instead. */
  group?: boolean;
}) {
  const captionContent = label && (
    <>
      {label}
      {required && <span className="ml-0.5 text-[color:var(--color-danger-500)]">*</span>}
    </>
  );
  const captionClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-2)]";
  const footer = (
    <>
      {hint && !error && (
        <span className="mt-1.5 block text-xs text-[color:var(--color-text-3)]">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs text-[color:var(--color-danger-500)]">
          {error}
        </span>
      )}
    </>
  );
  if (group) {
    return (
      <fieldset className="m-0 block min-w-0 border-0 p-0">
        {label && <legend className={`p-0 ${captionClass}`}>{captionContent}</legend>}
        {children}
        {footer}
      </fieldset>
    );
  }
  return (
    <label className="block" htmlFor={htmlFor}>
      {label && <span className={captionClass}>{captionContent}</span>}
      {children}
      {footer}
    </label>
  );
}

type InputBaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix">;

interface InputExtra {
  error?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Input({
  error,
  leadingIcon,
  trailingIcon,
  className = "",
  ...props
}: InputBaseProps & InputExtra) {
  const fieldClass = `${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_DEFAULT} ${leadingIcon ? "pl-9" : ""} ${trailingIcon ? "pr-9" : ""}`;
  if (!leadingIcon && !trailingIcon) {
    return (
      <input
        {...props}
        aria-invalid={error || undefined}
        className={`${fieldClass} ${className}`}
      />
    );
  }
  return (
    <span className={`relative inline-flex w-full ${className}`}>
      {leadingIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-[color:var(--color-text-3)]">
          {leadingIcon}
        </span>
      )}
      <input {...props} aria-invalid={error || undefined} className={fieldClass} />
      {trailingIcon && (
        <span className="absolute inset-y-0 right-3 z-10 flex items-center text-[color:var(--color-text-3)]">
          {trailingIcon}
        </span>
      )}
    </span>
  );
}

function formatDecimal(value: number | undefined, locale: string): string {
  if (value == null) return "";
  try {
    return new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 4 }).format(
      value,
    );
  } catch {
    return String(value);
  }
}

export function parseDecimal(raw: string): number | undefined | null {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  // Accept both "37,5" and "37.5"; reject anything else (units, letters).
  if (!/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed.replace(",", "."));
  // A long enough digit string overflows to Infinity (JSON writes it as null).
  return Number.isFinite(n) ? n : null;
}

/**
 * Numeric text input that keeps what the user types until blur. Parsing on
 * every keystroke turned "37," into 37 and then "375", and silently cleared
 * the field on a stray letter. Invalid input is flagged instead of dropped.
 */
export function DecimalInput({
  value,
  onCommit,
  locale,
  min,
  integer = false,
  className,
  ...props
}: Omit<InputBaseProps, "value" | "onChange" | "type" | "inputMode" | "min"> & {
  value: number | undefined;
  onCommit: (next: number | undefined) => void;
  locale: string;
  min?: number;
  integer?: boolean;
}) {
  const [text, setText] = useState(() => formatDecimal(value, locale));
  const focused = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Follow external changes (other tab, import) while the user isn't editing.
  // Keyed on the value only: re-running on blur would briefly write the stale
  // value back before the committed one arrives.
  useEffect(() => {
    if (!focused.current) setText(formatDecimal(value, locale));
  }, [value, locale]);

  const commit = () => {
    const parsed = parseDecimal(text);
    if (parsed === null) {
      setError("Bitte eine Zahl eingeben.");
      return;
    }
    if (parsed != null && integer && !Number.isInteger(parsed)) {
      setError("Bitte eine ganze Zahl eingeben.");
      return;
    }
    if (parsed != null && min != null && parsed < min) {
      setError(`Mindestens ${formatDecimal(min, locale)}.`);
      return;
    }
    setError(null);
    if (parsed !== value) onCommit(parsed);
    setText(formatDecimal(parsed, locale));
  };

  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={text}
        error={error != null}
        className={className}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onBlur={() => {
          focused.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-[color:var(--color-danger-500)]">
          {error}
        </span>
      )}
    </>
  );
}

export function Textarea({
  error,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={error || undefined}
      className={`${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_DEFAULT} min-h-20 resize-y ${className}`}
    />
  );
}

export function Select({
  error,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={error || undefined}
      className={`${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_DEFAULT} pr-8 ${className}`}
    />
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm select-none">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[color:var(--color-border-strong)] text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span>
        <span className="text-[color:var(--color-text-1)]">{label}</span>
        {hint && <span className="block text-xs text-[color:var(--color-text-3)]">{hint}</span>}
      </span>
    </label>
  );
}
