import { useEffect, useState } from "react";
import { parseDuration } from "../lib/duration";
import { formatDuration } from "../lib/format";
import { Field, Input } from "./ui/Input";

export function DurationInput({
  label,
  valueSec,
  onChangeSec,
  required,
}: {
  label?: string;
  valueSec: number;
  onChangeSec: (next: number) => void;
  required?: boolean;
}) {
  const [text, setText] = useState(() => formatDuration(valueSec, "long"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(formatDuration(valueSec, "long"));
  }, [valueSec]);

  const handleBlur = () => {
    if (!text.trim()) {
      if (required) {
        setError("Bitte Dauer eingeben.");
        return;
      }
      onChangeSec(0);
      setError(null);
      return;
    }
    const parsed = parseDuration(text);
    if (parsed == null) {
      setError("Format unverständlich. Beispiele: 1h 30m, 1.5, 90m, 01:30");
      return;
    }
    setError(null);
    onChangeSec(parsed);
    setText(formatDuration(parsed, "long"));
  };

  return (
    <Field label={label} hint="Beispiele: 1h 30m, 1.5, 90m, 01:30" error={error}>
      <Input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="z. B. 1h 30m"
      />
    </Field>
  );
}
