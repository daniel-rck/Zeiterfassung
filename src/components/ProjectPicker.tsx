import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_PROJECT_COLOR, pickColor } from "../lib/categoryColors";
import { createProject } from "../lib/db/projects";
import { useProjects } from "../lib/hooks/useProjects";
import { useSettings } from "../lib/hooks/useSettings";
import { Button } from "./ui/Button";
import { Combobox, type ComboOption } from "./ui/Combobox";
import { Field, Input } from "./ui/Input";
import { useToast } from "./ui/Toast";

export function ProjectPicker({
  value,
  onChange,
  label = "Projekt",
  allowEmpty = true,
  emptyLabel = "Ohne Projekt",
}: {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  label?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const { projects } = useProjects();
  const { settings } = useSettings();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const toast = useToast();

  const options: ComboOption[] = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.client,
        color: p.color,
      })),
    [projects],
  );

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const project = await createProject({
        name: trimmed,
        color: pickColor(trimmed) || DEFAULT_PROJECT_COLOR,
        billableDefault: settings.defaultBillable,
        archived: false,
      });
      onChange(project.id);
      setName("");
      setCreating(false);
      toast.success(`Projekt „${project.name}“ angelegt`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (creating) {
    return (
      <Field label={label}>
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Neues Projekt"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              } else if (e.key === "Escape") {
                setCreating(false);
                setName("");
              }
            }}
          />
          <Button variant="primary" onClick={() => void handleCreate()}>
            Anlegen
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCreating(false);
              setName("");
            }}
          >
            Abbrechen
          </Button>
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Combobox
            options={options}
            value={value}
            onChange={onChange}
            placeholder={emptyLabel}
            clearLabel={emptyLabel}
            allowClear={allowEmpty}
            ariaLabel={label}
          />
        </div>
        <Button
          variant="outline"
          icon={<Plus size={14} />}
          onClick={() => setCreating(true)}
          aria-label="Neues Projekt anlegen"
        >
          Neu
        </Button>
      </div>
    </Field>
  );
}
