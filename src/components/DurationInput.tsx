import { useEffect, useRef, useState } from "react";
import { parseDuration } from "../lib/duration";
import { formatDuration } from "../lib/format";
import { Field, Input } from "./ui/Input";

export function DurationInput({
  label,
  valueSec,
  onChangeSec,
  onValidityChange,
  required,
}: {
  label?: string;
  valueSec: number;
  onChangeSec: (next: number) => void;
  /** Reports whether the current text is a usable duration, so a form can
   *  refuse to save instead of silently keeping the previous value. */
  onValidityChange?: (valid: boolean) => void;
  required?: boolean;
}) {
  const [text, setText] = useState(() => formatDuration(valueSec, "long"));
  const [error, setError] = useState<string | null>(null);
  // The last value this input emitted itself. Changes coming back from the
  // parent that match it must not reformat the text mid-typing ("1," → "1h").
  const emitted = useRef(valueSec);

  useEffect(() => {
    if (valueSec === emitted.current) return;
    emitted.current = valueSec;
    setText(formatDuration(valueSec, "long"));
    setError(null);
    onValidityChange?.(true);
  }, [valueSec, onValidityChange]);

  const evaluate = (raw: string): number | "empty" | null => {
    if (!raw.trim()) return "empty";
    return parseDuration(raw);
  };

  // Commit on every change, so Cmd+Enter or a click on "Speichern" without a
  // blur still saves what is on screen.
  const handleChange = (raw: string) => {
    setText(raw);
    const result = evaluate(raw);
    const next = result === "empty" ? 0 : result;
    if (next != null) {
      emitted.current = next;
      onChangeSec(next);
      setError(null);
    }
    onValidityChange?.(next != null && !(required && result === "empty"));
  };

  const handleBlur = () => {
    const result = evaluate(text);
    if (result === "empty") {
      setError(required ? "Bitte Dauer eingeben." : null);
      return;
    }
    if (result == null) {
      setError("Format unverständlich. Beispiele: 1h 30m, 1.5, 90m, 01:30");
      return;
    }
    setError(null);
    setText(formatDuration(result, "long"));
  };

  return (
    <Field label={label} hint="Beispiele: 1h 30m, 1.5, 90m, 01:30" error={error}>
      <Input
        type="text"
        value={text}
        error={error != null}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="z. B. 1h 30m"
      />
    </Field>
  );
}
