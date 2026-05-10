import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProjects } from '../lib/hooks/useProjects'
import { createProject } from '../lib/db/projects'
import { DEFAULT_PROJECT_COLOR, pickColor } from '../lib/categoryColors'
import { useSettings } from '../lib/hooks/useSettings'
import { Field, Input } from './ui/Input'
import { useToast } from './ui/Toast'

export function ProjectPicker({
  value,
  onChange,
  label = 'Projekt',
  allowEmpty = true,
  emptyLabel = 'Ohne Projekt',
}: {
  value: string | undefined
  onChange: (id: string | undefined) => void
  label?: string
  allowEmpty?: boolean
  emptyLabel?: string
}) {
  const { projects } = useProjects()
  const { settings } = useSettings()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const toast = useToast()

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const project = await createProject({
        name: trimmed,
        color: pickColor(trimmed) || DEFAULT_PROJECT_COLOR,
        billableDefault: settings.defaultBillable,
        archived: false,
      })
      onChange(project.id)
      setName('')
      setCreating(false)
      toast.success(`Projekt „${project.name}“ angelegt`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

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
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleCreate()
              } else if (e.key === 'Escape') {
                setCreating(false)
                setName('')
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            className="rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Anlegen
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false)
              setName('')
            }}
            className="rounded-lg px-3 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </button>
        </div>
      </Field>
    )
  }

  return (
    <Field label={label}>
      <div className="flex gap-2">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {allowEmpty && <option value="">{emptyLabel}</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.client ? ` · ${p.client}` : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Neues Projekt anlegen"
        >
          <Plus size={14} /> Neu
        </button>
      </div>
    </Field>
  )
}
