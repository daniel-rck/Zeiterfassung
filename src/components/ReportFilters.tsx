import { useFeatures } from "../lib/hooks/useFeature";
import { useProjects } from "../lib/hooks/useProjects";
import { useTags } from "../lib/hooks/useTags";
import { RANGE_PRESET_LABELS, type RangePreset } from "../lib/reports/range";
import { Combobox, type ComboOption } from "./ui/Combobox";
import { Checkbox, Field, Input } from "./ui/Input";
import { type Segment, SegmentedControl } from "./ui/SegmentedControl";

export interface ReportFilterState {
  preset: RangePreset;
  customFrom: string;
  customTo: string;
  projectId: string | "all" | "none";
  tagId: string | "all";
  billableOnly: boolean;
}

const QUICK_PRESETS: RangePreset[] = [
  "today",
  "thisWeek",
  "thisMonth",
  "last30Days",
  "thisYear",
  "custom",
];

export function ReportFilters({
  state,
  onChange,
}: {
  state: ReportFilterState;
  onChange: (next: ReportFilterState) => void;
}) {
  const { projects } = useProjects();
  const { tags } = useTags();
  const features = useFeatures();

  const presetSegments: Segment<RangePreset>[] = QUICK_PRESETS.map((preset) => ({
    value: preset,
    label:
      preset === "today"
        ? "Heute"
        : preset === "thisWeek"
          ? "Woche"
          : preset === "thisMonth"
            ? "Monat"
            : preset === "last30Days"
              ? "30 Tage"
              : preset === "thisYear"
                ? "Jahr"
                : "Custom",
  }));

  const projectOptions: ComboOption[] = [
    { value: "all", label: "Alle Projekte" },
    { value: "none", label: "Ohne Projekt" },
    ...projects.map((p) => ({
      value: p.id,
      label: p.name,
      color: p.color,
      hint: p.client,
    })),
  ];
  const tagOptions: ComboOption[] = [
    { value: "all", label: "Alle Tags" },
    ...tags.map((t) => ({
      value: t.id,
      label: t.name,
      color: t.color,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          segments={presetSegments}
          value={QUICK_PRESETS.includes(state.preset) ? state.preset : "custom"}
          onChange={(preset) => onChange({ ...state, preset })}
          ariaLabel="Zeitraum-Voreinstellung"
        />
        {!QUICK_PRESETS.includes(state.preset) && (
          <span className="text-xs text-[color:var(--color-text-3)]">
            {RANGE_PRESET_LABELS[state.preset]}
          </span>
        )}
      </div>

      {state.preset === "custom" && (
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {features.projects && (
          <Field label="Projekt">
            <Combobox
              options={projectOptions}
              value={state.projectId}
              onChange={(next) =>
                onChange({
                  ...state,
                  projectId: (next ?? "all") as ReportFilterState["projectId"],
                })
              }
              allowClear={false}
              ariaLabel="Projekt-Filter"
            />
          </Field>
        )}
        {features.tags && (
          <Field label="Tag">
            <Combobox
              options={tagOptions}
              value={state.tagId}
              onChange={(next) => onChange({ ...state, tagId: next ?? "all" })}
              allowClear={false}
              ariaLabel="Tag-Filter"
            />
          </Field>
        )}
      </div>

      {features.billing && (
        <div>
          <Checkbox
            label="Nur abrechenbare Einträge"
            checked={state.billableOnly}
            onChange={(billableOnly) => onChange({ ...state, billableOnly })}
          />
        </div>
      )}
    </div>
  );
}
