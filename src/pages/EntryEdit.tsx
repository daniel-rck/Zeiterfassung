import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'
import { Field, Input, Textarea, Checkbox } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ProjectPicker } from '../components/ProjectPicker'
import { TagPicker } from '../components/TagPicker'
import { DurationInput } from '../components/DurationInput'
import { Gated } from '../components/Gated'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/Confirm'
import { createEntry, deleteEntry, getEntry, updateEntry } from '../lib/db/timeEntries'
import { useSettings } from '../lib/hooks/useSettings'
import { useProjects } from '../lib/hooks/useProjects'

interface FormState {
  description: string
  projectId?: string
  date: string
  startTime: string
  durationSec: number
  billable: boolean
  tagIds: string[]
  notes: string
}

function toDateInput(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toTimeInput(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function combineDateTime(date: string, time: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute).getTime()
}

export function EntryEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const { settings } = useSettings()
  const { projects } = useProjects()
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const [loading, setLoading] = useState(!isNew)
  const [form, setForm] = useState<FormState>(() => {
    const now = new Date()
    return {
      description: '',
      projectId: undefined,
      date: toDateInput(now.getTime()),
      startTime: toTimeInput(now.getTime()),
      durationSec: 0,
      billable: settings.defaultBillable,
      tagIds: [],
      notes: '',
    }
  })

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const entry = await getEntry(id!)
      if (!entry) {
        toast.error('Eintrag nicht gefunden')
        navigate('/entries')
        return
      }
      setForm({
        description: entry.description,
        projectId: entry.projectId,
        date: toDateInput(entry.startedAt),
        startTime: toTimeInput(entry.startedAt),
        durationSec: entry.durationSec,
        billable: entry.billable,
        tagIds: entry.tagIds,
        notes: entry.notes ?? '',
      })
      setLoading(false)
    })()
  }, [id, isNew, navigate, toast])

  const handleSave = async () => {
    if (form.durationSec <= 0) {
      toast.error('Dauer muss größer als 0 sein.')
      return
    }
    const startedAt = combineDateTime(form.date, form.startTime)
    const endedAt = startedAt + form.durationSec * 1000
    const project = form.projectId ? projectMap.get(form.projectId) : undefined

    if (isNew) {
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
      })
      toast.success('Eintrag angelegt')
    } else {
      await updateEntry(id!, {
        description: form.description,
        projectId: form.projectId,
        startedAt,
        endedAt,
        durationSec: form.durationSec,
        billable: form.billable,
        tagIds: form.tagIds,
        notes: form.notes || undefined,
      })
      toast.success('Gespeichert')
    }
    navigate(-1)
  }

  const handleDelete = async () => {
    if (isNew || !id) return
    const ok = await confirm.confirm({
      title: 'Eintrag löschen?',
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteEntry(id)
    toast.success('Gelöscht')
    navigate(-1)
  }

  if (loading) return <div className="text-sm text-zinc-500">Lädt …</div>

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}
        </h1>
        {!isNew && (
          <Button variant="ghost" onClick={() => void handleDelete()} icon={<Trash2 size={14} />}>
            Löschen
          </Button>
        )}
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <Field label="Beschreibung">
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Was hast du gemacht?"
            autoFocus={isNew}
          />
        </Field>

        <Gated level="standard">
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

        <Gated level="pro">
          <TagPicker
            value={form.tagIds}
            onChange={(tagIds) => setForm({ ...form, tagIds })}
          />
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

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={() => void handleSave()} icon={<Save size={16} />}>
          Speichern
        </Button>
      </div>
    </div>
  )
}
