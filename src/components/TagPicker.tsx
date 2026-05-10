import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTags } from '../lib/hooks/useTags'
import { createTag } from '../lib/db/tags'
import { DEFAULT_TAG_COLOR, pickColor } from '../lib/categoryColors'
import { Field } from './ui/Input'
import { useToast } from './ui/Toast'

export function TagPicker({
  value,
  onChange,
  label = 'Tags',
}: {
  value: string[]
  onChange: (next: string[]) => void
  label?: string
}) {
  const { tags } = useTags()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const toast = useToast()

  const selected = new Set(value)
  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const create = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const tag = await createTag({
        name: trimmed,
        color: pickColor(trimmed) || DEFAULT_TAG_COLOR,
        archived: false,
      })
      onChange([...value, tag.id])
      setName('')
      setAdding(false)
      toast.success(`Tag „${tag.name}“ angelegt`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.has(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors no-min-tap ${
                isSelected
                  ? 'border-transparent text-white'
                  : 'border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600'
              }`}
              style={isSelected ? { backgroundColor: tag.color } : undefined}
            >
              <span
                className={isSelected ? 'h-2 w-2 rounded-full bg-white/70' : 'h-2 w-2 rounded-full'}
                style={isSelected ? undefined : { backgroundColor: tag.color }}
              />
              {tag.name}
              {isSelected && <X size={12} />}
            </button>
          )
        })}
        {adding ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void create()
              } else if (e.key === 'Escape') {
                setAdding(false)
                setName('')
              }
            }}
            onBlur={() => {
              if (name.trim()) {
                void create()
              } else {
                setAdding(false)
              }
            }}
            placeholder="Tag-Name"
            className="rounded-full border border-brand-500 bg-white px-3 py-1 text-xs focus:outline-none dark:bg-zinc-900"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 no-min-tap"
          >
            <Plus size={12} /> Tag
          </button>
        )}
      </div>
    </Field>
  )
}
