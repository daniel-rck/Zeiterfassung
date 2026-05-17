import { useState } from 'react'
import { Plus, Archive, ArchiveRestore, Trash2, Pencil } from 'lucide-react'
import { useProjects } from '../lib/hooks/useProjects'
import { useSettings } from '../lib/hooks/useSettings'
import { useFeature } from '../lib/hooks/useFeature'
import {
  archiveProject,
  countEntriesForProject,
  createProject,
  deleteProject,
  restoreProject,
  updateProject,
} from '../lib/db/projects'
import type { Project } from '../lib/types'
import { CATEGORY_COLORS, DEFAULT_PROJECT_COLOR } from '../lib/categoryColors'
import { Button } from '../components/ui/Button'
import { Field, Input, Checkbox } from '../components/ui/Input'
import { Sheet } from '../components/ui/Sheet'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/Confirm'
import { formatMoney } from '../lib/format'

interface ProjectDraft {
  name: string
  client: string
  color: string
  hourlyRate: string
  billableDefault: boolean
}

function emptyDraft(defaultBillable: boolean): ProjectDraft {
  return {
    name: '',
    client: '',
    color: DEFAULT_PROJECT_COLOR,
    hourlyRate: '',
    billableDefault: defaultBillable,
  }
}

export function ProjectsPage() {
  const { settings } = useSettings()
  const billingOn = useFeature('billing')
  const { projects } = useProjects({ includeArchived: true })
  const toast = useToast()
  const confirm = useConfirm()

  const [editing, setEditing] = useState<Project | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ProjectDraft>(() =>
    emptyDraft(settings.defaultBillable),
  )

  const startNew = () => {
    setEditing(null)
    setDraft(emptyDraft(settings.defaultBillable))
    setOpen(true)
  }

  const startEdit = (project: Project) => {
    setEditing(project)
    setDraft({
      name: project.name,
      client: project.client ?? '',
      color: project.color,
      hourlyRate: project.hourlyRate != null ? String(project.hourlyRate) : '',
      billableDefault: project.billableDefault,
    })
    setOpen(true)
  }

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error('Bitte einen Namen eingeben.')
      return
    }
    const rateNum = draft.hourlyRate
      ? Number(draft.hourlyRate.replace(',', '.'))
      : undefined
    const rate = rateNum != null && Number.isFinite(rateNum) ? rateNum : undefined
    const payload = {
      name: draft.name.trim(),
      client: draft.client.trim() || undefined,
      color: draft.color,
      hourlyRate: rate,
      currency: rate != null ? settings.currency : undefined,
      billableDefault: draft.billableDefault,
    }
    if (editing) {
      await updateProject(editing.id, payload)
      toast.success('Projekt gespeichert')
    } else {
      await createProject({ ...payload, archived: false })
      toast.success('Projekt angelegt')
    }
    setOpen(false)
  }

  const handleDelete = async (project: Project) => {
    const count = await countEntriesForProject(project.id)
    const ok = await confirm.confirm({
      title: `„${project.name}“ löschen?`,
      description:
        count === 0
          ? 'Es sind keine Einträge mit diesem Projekt verknüpft.'
          : `${count} Eintr${count === 1 ? 'ag verliert' : 'äge verlieren'} die Projektzuordnung.`,
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    const result = await deleteProject(project.id)
    toast.success(
      result.cleaned > 0
        ? `Gelöscht (${result.cleaned} Eintr${result.cleaned === 1 ? 'ag' : 'äge'} entkoppelt)`
        : 'Gelöscht',
    )
  }

  const active = projects.filter((p) => !p.archived)
  const archived = projects.filter((p) => p.archived)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Projekte
          </h1>
          <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
            {active.length} aktiv
            {archived.length > 0 && ` · ${archived.length} archiviert`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={startNew}
        >
          Neues Projekt
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-8 text-center text-sm text-[color:var(--color-text-3)]">
          Noch keine Projekte. Lege eins an, um Stunden zuzuordnen.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {active.map((project) => (
            <li
              key={project.id}
              className="group flex items-center gap-3 rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-3 py-2.5 transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              <span
                aria-hidden="true"
                className="h-7 w-1 flex-shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <button
                type="button"
                onClick={() => startEdit(project)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[color:var(--color-text-1)]">
                    {project.name}
                  </span>
                  {billingOn && project.billableDefault && (
                    <Badge tone="success" size="xs">
                      abrechenbar
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-[color:var(--color-text-3)]">
                  {project.client && <span>{project.client}</span>}
                  {billingOn && project.hourlyRate != null && (
                    <span>
                      {project.client ? ' · ' : ''}
                      <span className="tnum font-mono">
                        {formatMoney(
                          project.hourlyRate,
                          project.currency ?? settings.currency,
                          settings.locale,
                        )}
                        /h
                      </span>
                    </span>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => startEdit(project)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-3)] opacity-0 transition hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-1)] group-hover:opacity-100 no-min-tap"
                  aria-label="Bearbeiten"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void archiveProject(project.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-3)] opacity-0 transition hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-1)] group-hover:opacity-100 no-min-tap"
                  aria-label="Archivieren"
                  title="Archivieren"
                >
                  <Archive size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(project)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-3)] opacity-0 transition hover:bg-[color:var(--color-danger-500)]/10 hover:text-[color:var(--color-danger-500)] group-hover:opacity-100 no-min-tap"
                  aria-label="Löschen"
                  title="Löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[color:var(--color-text-2)]">
            Archivierte Projekte ({archived.length})
          </summary>
          <ul className="mt-3 space-y-1">
            {archived.map((project) => (
              <li
                key={project.id}
                className="flex items-center gap-3 text-sm text-[color:var(--color-text-3)]"
              >
                <span
                  className="h-2 w-2 rounded-full opacity-50"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 truncate">{project.name}</span>
                <button
                  type="button"
                  onClick={() => void restoreProject(project.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--color-text-3)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)] no-min-tap"
                  aria-label="Wiederherstellen"
                  title="Wiederherstellen"
                >
                  <ArchiveRestore size={13} />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Projekt bearbeiten' : 'Neues Projekt'}
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field
            label="Kunde"
            hint="Optional. Erscheint in Reports und auf Rechnungen."
          >
            <Input
              value={draft.client}
              onChange={(e) => setDraft({ ...draft, client: e.target.value })}
            />
          </Field>
          <Field label="Farbe">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, color: c.value })}
                  className={`h-7 w-7 rounded-md ring-2 transition-all no-min-tap ${
                    draft.color === c.value
                      ? 'ring-[color:var(--color-text-1)]'
                      : 'ring-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
          </Field>
          {billingOn && (
            <>
              <Field
                label={`Stundensatz (${settings.currency})`}
                hint="Optional, gilt nur für neue Einträge."
              >
                <Input
                  type="text"
                  inputMode="decimal"
                  value={draft.hourlyRate}
                  onChange={(e) =>
                    setDraft({ ...draft, hourlyRate: e.target.value })
                  }
                  placeholder="z. B. 90"
                />
              </Field>
              <Checkbox
                label="Standardmäßig abrechenbar"
                checked={draft.billableDefault}
                onChange={(billableDefault) =>
                  setDraft({ ...draft, billableDefault })
                }
              />
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={() => void save()}>
              Speichern
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
