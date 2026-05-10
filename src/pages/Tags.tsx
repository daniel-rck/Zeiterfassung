import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTags } from '../lib/hooks/useTags'
import { createTag, deleteTag, updateTag } from '../lib/db/tags'
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
    const ok = await confirm.confirm({
      title: `Tag „${tag.name}“ löschen?`,
      description: 'Der Tag wird aus allen Einträgen entfernt.',
      tone: 'danger',
      confirmLabel: 'Löschen',
    })
    if (!ok) return
    await deleteTag(tag.id)
    toast.success('Gelöscht')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tags</h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={startNew}>
          Neuer Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          Noch keine Tags.
        </p>
      ) : (
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
            >
              <span
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => startEdit(tag)}
                className="flex-1 truncate text-left text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                {tag.name}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(tag)}
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

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Tag bearbeiten' : 'Neuer Tag'}
        size="sm"
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Farbe">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-8 w-8 rounded-full ring-2 transition-all no-min-tap ${
                    color === c.value ? 'ring-zinc-900 dark:ring-zinc-100' : 'ring-transparent'
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
