import { useState } from 'react'
import { Plus, Trash2, Archive, ArchiveRestore } from 'lucide-react'
import { useTags } from '../lib/hooks/useTags'
import {
  archiveTag,
  countEntriesForTag,
  createTag,
  deleteTag,
  restoreTag,
  updateTag,
} from '../lib/db/tags'
import type { Tag } from '../lib/types'
import { CATEGORY_COLORS, DEFAULT_TAG_COLOR } from '../lib/categoryColors'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Sheet } from '../components/ui/Sheet'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/Confirm'

export function TagsPage() {
  const { tags } = useTags({ includeArchived: true })
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<Tag | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_TAG_COLOR)

  const startNew = () => {
    setEditing(null)
    setName('')
    setColor(DEFAULT_TAG_COLOR)
    setOpen(true)
  }

  const startEdit = (tag: Tag) => {
    setEditing(tag)
    setName(tag.name)
    setColor(tag.color)
    setOpen(true)
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Bitte einen Namen eingeben.')
      return
    }
    if (editing) {
      await updateTag(editing.id, { name: trimmed, color })
      toast.success('Tag gespeichert')
    } else {
      await createTag({ name: trimmed, color, archived: false })
      toast.success('Tag angelegt')
    }
    setOpen(false)
  }

  const handleDelete = async (tag: Tag) => {
    const count = await countEntriesForTag(tag.id)
    const ok = await confirm.confirm({
      title: `Tag „${tag.name}“ löschen?`,
      description:
        count === 0
          ? 'Kein Eintrag nutzt diesen Tag.'
          : `Der Tag wird aus ${count} Eintr${count === 1 ? 'ag' : 'ägen'} entfernt.`,
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    const result = await deleteTag(tag.id)
    toast.success(
      result.cleaned > 0
        ? `Gelöscht (aus ${result.cleaned} Eintr${result.cleaned === 1 ? 'ag' : 'ägen'} entfernt)`
        : 'Gelöscht',
    )
  }

  const active = tags.filter((t) => !t.archived)
  const archived = tags.filter((t) => t.archived)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
            Tags
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
          Neuer Tag
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-8 text-center text-sm text-[color:var(--color-text-3)]">
          Noch keine Tags.
        </div>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {active.map((tag) => (
            <li key={tag.id}>
              <div className="group inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] py-1 pl-2 pr-1 text-sm transition-colors hover:bg-[color:var(--color-surface-2)]">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <button
                  type="button"
                  onClick={() => startEdit(tag)}
                  className="text-[color:var(--color-text-1)] no-min-tap"
                >
                  {tag.name}
                </button>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => void archiveTag(tag.id)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-[color:var(--color-text-3)] opacity-0 transition hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-1)] group-hover:opacity-100 no-min-tap"
                    aria-label="Archivieren"
                  >
                    <Archive size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(tag)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-[color:var(--color-text-3)] opacity-0 transition hover:bg-[color:var(--color-danger-500)]/10 hover:text-[color:var(--color-danger-500)] group-hover:opacity-100 no-min-tap"
                    aria-label="Löschen"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[color:var(--color-text-2)]">
            Archivierte Tags ({archived.length})
          </summary>
          <ul className="mt-3 space-y-1">
            {archived.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center gap-3 text-sm text-[color:var(--color-text-3)]"
              >
                <span
                  className="h-2 w-2 rounded-full opacity-50"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 truncate">{tag.name}</span>
                <button
                  type="button"
                  onClick={() => void restoreTag(tag.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-[color:var(--color-surface-2)] no-min-tap"
                  aria-label="Wiederherstellen"
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
        title={editing ? 'Tag bearbeiten' : 'Neuer Tag'}
        size="sm"
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Farbe">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-md ring-2 transition-all no-min-tap ${
                    color === c.value
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
