import { Plus, X } from "lucide-react";
import { useState } from "react";
import { DEFAULT_TAG_COLOR, pickColor } from "../lib/categoryColors";
import { createTag } from "../lib/db/tags";
import { useTags } from "../lib/hooks/useTags";
import { Field } from "./ui/Input";
import { useToast } from "./ui/Toast";

export function TagPicker({
  value,
  onChange,
  label = "Tags",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const { tags } = useTags();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const toast = useToast();

  const selected = new Set(value);
  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const tag = await createTag({
        name: trimmed,
        color: pickColor(trimmed) || DEFAULT_TAG_COLOR,
        archived: false,
      });
      onChange([...value, tag.id]);
      setName("");
      setAdding(false);
      toast.success(`Tag „${tag.name}“ angelegt`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isSelected = selected.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors duration-150 no-min-tap ${
                isSelected
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  : "border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-2)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-1)]"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              {isSelected && <X size={11} />}
            </button>
          );
        })}
        {adding ? (
          <input
            // biome-ignore lint/a11y/noAutofocus: input is mounted on explicit user action (Tag hinzufügen)
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void create();
              } else if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
            onBlur={() => {
              if (name.trim()) {
                void create();
              } else {
                setAdding(false);
              }
            }}
            placeholder="Tag-Name"
            className="rounded-md border border-brand-500 bg-[color:var(--color-surface-1)] px-2 py-1 text-xs text-[color:var(--color-text-1)] focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-[color:var(--color-border-strong)] px-2 py-1 text-xs text-[color:var(--color-text-3)] transition-colors hover:border-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] no-min-tap"
          >
            <Plus size={11} /> Tag
          </button>
        )}
      </div>
    </Field>
  );
}
