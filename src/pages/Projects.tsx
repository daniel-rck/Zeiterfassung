import { useState } from 'react'
import { Plus, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useProjects } from '../lib/hooks/useProjects'
import { useSettings } from '../lib/hooks/useSettings'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'
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
  const { atLeast } = useDetailLevel()
  const { projects } = useProjects({ includeArchived: true })
  const toast = useToast()
  const confirm = useConfirm()

  const [editing, setEditing] = useState<Project | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ProjectDraft>(() => emptyDraft(settings.defaultBillable))

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
    const rateNum = draft.hourlyRate ? Number(draft.hourlyRate.replace(',', '.')) : undefined
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
          : `${count} Eintr${count === 1 ? 'ag verliert' : 'äge verlieren'} die Projektzuordnung. Stundensätze früherer Einträge bleiben als Snapshot erhalten.`,
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
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Projekte</h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={startNew}>
          Neues Projekt
        </Button>
      </div>

      {active.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          Noch keine Projekte. Lege eins an, um Stunden zuzuordnen.
        </p>
      ) : (
        <ul className="space-y-2">
          {active.map((project) => (
            <li
              key={project.id}
              className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
            >
              <span
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => startEdit(project)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {project.name}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  {project.client && <span>{project.client}</span>}
                  {atLeast('pro') && project.hourlyRate != null && (
                    <span>
                      {project.client ? ' · ' : ''}
                      {formatMoney(project.hourlyRate, project.currency ?? settings.currency, settings.locale)}/h
                    </span>
                  )}
                  {atLeast('pro') && project.billableDefault && <span> · abrechenbar</span>}
                </div>
              </button>
              <button
                type="button"
                onClick={() => void archiveProject(project.id)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 no-min-tap"
                aria-label="Archivieren"
                title="Archivieren"
              >
                <Archive size={16} />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(project)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 no-min-tap"
                aria-label="Löschen"
                title="Löschen"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="rounded-lg bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Archivierte Projekte ({archived.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {archived.map((project) => (
              <li
                key={project.id}
                className="flex items-center gap-3 text-sm text-zinc-500"
              >
                <span
                  className="h-3 w-3 rounded-full opacity-50"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 truncate">{project.name}</span>
                <button
                  type="button"
                  onClick={() => void restoreProject(project.id)}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 no-min-tap"
                  aria-label="Wiederherstellen"
                  title="Wiederherstellen"
                >
                  <ArchiveRestore size={14} />
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
          <Field label="Kunde" hint="Optional. Erscheint in Reports und auf Rechnungen.">
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
                  className={`h-8 w-8 rounded-full ring-2 transition-all no-min-tap ${
                    draft.color === c.value ? 'ring-zinc-900 dark:ring-zinc-100' : 'ring-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
            </div>
          </Field>
          {atLeast('pro') && (
            <>
              <Field label={`Stundensatz (${settings.currency})`} hint="Optional, gilt nur für neue Einträge.">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={draft.hourlyRate}
                  onChange={(e) => setDraft({ ...draft, hourlyRate: e.target.value })}
                  placeholder="z. B. 90"
                />
              </Field>
              <Checkbox
                label="Standardmäßig abrechenbar"
                checked={draft.billableDefault}
                onChange={(billableDefault) => setDraft({ ...draft, billableDefault })}
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
