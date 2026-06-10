import { Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DurationInput } from "../components/DurationInput";
import { Gated } from "../components/Gated";
import { ProjectPicker } from "../components/ProjectPicker";
import { TagPicker } from "../components/TagPicker";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useConfirm } from "../components/ui/Confirm";
import { Checkbox, Field, Input, Textarea } from "../components/ui/Input";
import { Kbd } from "../components/ui/Kbd";
import { useToast } from "../components/ui/Toast";
import { createEntry, deleteEntry, getEntry, updateEntry } from "../lib/db/timeEntries";
import { useProjects } from "../lib/hooks/useProjects";
import { useSettings } from "../lib/hooks/useSettings";
import { modKey } from "../lib/platform";

interface FormState {
  description: string;
  projectId?: string;
  date: string;
  startTime: string;
  durationSec: number;
  billable: boolean;
  tagIds: string[];
  notes: string;
}

function toDateInput(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInput(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

export function EntryEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { settings } = useSettings();
  const { projects } = useProjects();
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(() => {
    const now = new Date();
    return {
      description: "",
      projectId: undefined,
      date: toDateInput(now.getTime()),
      startTime: toTimeInput(now.getTime()),
      durationSec: 0,
      billable: settings.defaultBillable,
      tagIds: [],
      notes: "",
    };
  });

  useEffect(() => {
    if (isNew || !id) return;
    void (async () => {
      const entry = await getEntry(id);
      if (!entry) {
        toast.error("Eintrag nicht gefunden");
        navigate("/entries");
        return;
      }
      setForm({
        description: entry.description,
        projectId: entry.projectId,
        date: toDateInput(entry.startedAt),
        startTime: toTimeInput(entry.startedAt),
        durationSec: entry.durationSec,
        billable: entry.billable,
        tagIds: entry.tagIds,
        notes: entry.notes ?? "",
      });
      setLoading(false);
    })();
  }, [id, isNew, navigate, toast]);

  const handleSave = useCallback(async () => {
    if (form.durationSec <= 0) {
      toast.error("Dauer muss größer als 0 sein.");
      return;
    }
    setSubmitting(true);
    try {
      const startedAt = combineDateTime(form.date, form.startTime);
      const endedAt = startedAt + form.durationSec * 1000;
      const project = form.projectId ? projectMap.get(form.projectId) : undefined;

      if (isNew || !id) {
        await createEntry({
          description: form.description,
          projectId: form.projectId,
          startedAt,
          endedAt,
          billable: form.billable,
          tagIds: form.tagIds,
          notes: form.notes || undefined,
          hourlyRateSnapshot: project?.hourlyRate,
          currencySnapshot: project?.currency,
        });
        toast.success("Eintrag angelegt");
      } else {
        await updateEntry(id, {
          description: form.description,
          projectId: form.projectId,
          startedAt,
          endedAt,
          durationSec: form.durationSec,
          billable: form.billable,
          tagIds: form.tagIds,
          notes: form.notes || undefined,
        });
        toast.success("Gespeichert");
      }
      navigate(-1);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [form, id, isNew, navigate, projectMap, toast]);

  const handleDelete = async () => {
    if (isNew || !id) return;
    const ok = await confirm.confirm({
      title: "Eintrag löschen?",
      description: "Dieser Eintrag wird endgültig entfernt.",
      tone: "danger",
      confirmLabel: "Löschen",
    });
    if (!ok) return;
    await deleteEntry(id);
    toast.success("Gelöscht");
    navigate(-1);
  };

  // Cmd/Ctrl+Enter saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
          {isNew ? "Neuer Eintrag" : "Eintrag bearbeiten"}
        </h1>
        {!isNew && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleDelete()}
            icon={<Trash2 size={14} />}
          >
            Löschen
          </Button>
        )}
      </div>

      <Card padding="md">
        <div className="space-y-4">
          <Field label="Beschreibung">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Was hast du gemacht?"
              autoFocus={isNew}
            />
          </Field>

          <Gated feature="projects">
            <ProjectPicker
              value={form.projectId}
              onChange={(projectId) => setForm({ ...form, projectId })}
            />
          </Gated>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Datum">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Startzeit">
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </Field>
            <DurationInput
              label="Dauer"
              valueSec={form.durationSec}
              onChangeSec={(durationSec) => setForm({ ...form, durationSec })}
              required
            />
          </div>

          <Gated feature="tags">
            <TagPicker value={form.tagIds} onChange={(tagIds) => setForm({ ...form, tagIds })} />
          </Gated>
          <Gated feature="billing">
            <Checkbox
              label="Abrechenbar"
              checked={form.billable}
              onChange={(billable) => setForm({ ...form, billable })}
              hint="Fließt in Reports und Rechnungen ein."
            />
          </Gated>

          <Field label="Notizen" hint="Optional, bleibt nur lokal.">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="…"
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-xs text-[color:var(--color-text-3)] sm:inline">
          <Kbd>{modKey()}</Kbd>+<Kbd>Enter</Kbd> zum Speichern
        </span>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Abbrechen
        </Button>
        <Button
          variant="primary"
          loading={submitting}
          onClick={() => void handleSave()}
          icon={<Save size={14} />}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}
