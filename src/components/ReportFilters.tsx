import { Field, Input, Select, Checkbox } from './ui/Input'
import { useProjects } from '../lib/hooks/useProjects'
import { useTags } from '../lib/hooks/useTags'
import { useFeatures } from '../lib/hooks/useFeature'
import { RANGE_PRESET_LABELS, type RangePreset } from '../lib/reports/range'

export interface ReportFilterState {
  preset: RangePreset
  customFrom: string
  customTo: string
  projectId: string | 'all' | 'none'
  tagId: string | 'all'
  billableOnly: boolean
}

export function ReportFilters({
  state,
  onChange,
}: {
  state: ReportFilterState
  onChange: (next: ReportFilterState) => void
}) {
  const { projects } = useProjects()
  const { tags } = useTags()
  const features = useFeatures()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
      <Field label="Zeitraum">
        <Select
          value={state.preset}
          onChange={(e) => onChange({ ...state, preset: e.target.value as RangePreset })}
        >
          {(Object.keys(RANGE_PRESET_LABELS) as RangePreset[]).map((preset) => (
            <option key={preset} value={preset}>
              {RANGE_PRESET_LABELS[preset]}
            </option>
          ))}
        </Select>
      </Field>
      {state.preset === 'custom' && (
        <>
          <Field label="Von">
            <Input
              type="date"
              value={state.customFrom}
              onChange={(e) => onChange({ ...state, customFrom: e.target.value })}
            />
          </Field>
          <Field label="Bis">
            <Input
              type="date"
              value={state.customTo}
              onChange={(e) => onChange({ ...state, customTo: e.target.value })}
            />
          </Field>
        </>
      )}
      <Field label="Projekt">
        <Select
          value={state.projectId}
          onChange={(e) => onChange({ ...state, projectId: e.target.value as ReportFilterState['projectId'] })}
        >
          <option value="all">Alle</option>
          <option value="none">Ohne Projekt</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      {features.tags && (
        <Field label="Tag">
          <Select
            value={state.tagId}
            onChange={(e) => onChange({ ...state, tagId: e.target.value })}
          >
            <option value="all">Alle</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {features.billing && (
        <Field label="Status">
          <div className="pt-2">
            <Checkbox
              label="Nur abrechenbar"
              checked={state.billableOnly}
              onChange={(billableOnly) => onChange({ ...state, billableOnly })}
            />
          </div>
        </Field>
      )}
    </div>
  )
}
