import { useState } from 'react'
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FolderKanban,
  Tags as TagsIcon,
  BarChart3,
  Banknote,
  FileText,
  Coffee,
  Timer,
  Bell,
  Gauge,
  CalendarDays,
} from 'lucide-react'
import { useSettings } from '../lib/hooks/useSettings'
import { useDetailLevel } from '../lib/hooks/useDetailLevel'
import { patchSettings, presetFromLevel } from '../lib/db/settings'
import type { DetailLevel, FeatureFlags, FeatureName, InvoiceProfile, Settings } from '../lib/types'
import { DETAIL_LEVEL_ORDER } from '../lib/types'
import { Field, Input, Select, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import { useToast } from '../components/ui/Toast'
import { useConfirm } from '../components/ui/Confirm'
import { downloadSnapshot } from '../lib/io/exportJson'
import { pickAndImport } from '../lib/io/importJson'
import { OnboardingSheet, labelFor } from '../components/Onboarding/OnboardingSheet'
import { broadcast } from '../lib/db/broadcast'
import { getDB } from '../lib/db'
import { formatRelativeDay } from '../lib/format'

const LEVELS: DetailLevel[] = ['basis', 'standard', 'pro', 'proplus']

interface FeatureMeta {
  name: FeatureName
  label: string
  description: string
  icon: React.ReactNode
}

const CORE_FEATURES: FeatureMeta[] = [
  { name: 'projects', label: 'Projekte', description: 'Einträge nach Projekten gruppieren', icon: <FolderKanban size={18} /> },
  { name: 'tags', label: 'Tags', description: 'Einträge mit farbigen Tags markieren', icon: <TagsIcon size={18} /> },
  { name: 'reports', label: 'Reports', description: 'Auswertungen nach Woche/Monat, CSV-Export', icon: <BarChart3 size={18} /> },
  { name: 'billing', label: 'Abrechnung', description: 'Stundensätze, abrechenbar-Marker, Rundung', icon: <Banknote size={18} /> },
  { name: 'invoicing', label: 'Rechnungen', description: 'Rechnungs-Vorschau, PDF-Export, Archiv', icon: <FileText size={18} /> },
]

const ADVANCED_FEATURES: FeatureMeta[] = [
  { name: 'breaks', label: 'Pausen', description: 'Pausen während eines laufenden Eintrags erfassen', icon: <Coffee size={18} /> },
  { name: 'pomodoro', label: 'Pomodoro', description: '25/5-Modus für den Timer', icon: <Timer size={18} /> },
  { name: 'notifications', label: 'Erinnerungen', description: 'Web-Benachrichtigungen für tägliche Reminder', icon: <Bell size={18} /> },
  { name: 'hoursAccount', label: 'Stundenkonto', description: 'Wochen-Soll, Ist und Überstunden im Blick', icon: <Gauge size={18} /> },
  { name: 'weeklyView', label: 'Wochenübersicht', description: 'Tagesliste Mo–So mit Summen', icon: <CalendarDays size={18} /> },
]

export function SettingsPage() {
  const { settings } = useSettings()
  const { level } = useDetailLevel()
  const toast = useToast()
  const confirm = useConfirm()
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [upgradeFrom, setUpgradeFrom] = useState<DetailLevel | undefined>(undefined)
  const [targetLevel, setTargetLevel] = useState<DetailLevel | undefined>(undefined)

  const handleLevelClick = async (next: DetailLevel) => {
    if (next === level) return
    const isUpgrade = DETAIL_LEVEL_ORDER[next] > DETAIL_LEVEL_ORDER[level]
    if (isUpgrade) {
      setUpgradeFrom(level)
      setTargetLevel(next)
      setOnboardingOpen(true)
      return
    }
    const ok = await confirm.confirm({
      title: `Auf „${labelFor(next)}“ runterstufen?`,
      description:
        'Setzt die Funktionen auf das Preset dieser Stufe zurück. Daten bleiben in der Datenbank erhalten.',
      confirmLabel: 'Runterstufen',
    })
    if (!ok) return
    patchSettings({ detailLevel: next, features: presetFromLevel(next) })
    toast.success(`Stufe: ${labelFor(next)}`)
  }

  const toggleFeature = (name: FeatureName, next: boolean) => {
    const features: FeatureFlags = { ...settings.features, [name]: next }
    patchSettings({ features })
  }

  const applyPreset = async () => {
    const ok = await confirm.confirm({
      title: `Funktionen auf „${labelFor(level)}“-Preset zurücksetzen?`,
      description:
        'Setzt alle Funktions-Schalter auf die Voreinstellung dieser Stufe. Erweiterte Module (Pausen, Erinnerungen, …) bleiben aus.',
      confirmLabel: 'Zurücksetzen',
    })
    if (!ok) return
    patchSettings({ features: presetFromLevel(level) })
    toast.success('Funktionen zurückgesetzt')
  }

  const updateInvoiceProfile = (patch: Partial<InvoiceProfile>) => {
    patchSettings({
      invoiceProfile: { ...(settings.invoiceProfile ?? {}), ...patch },
    })
  }

  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    patchSettings({ [key]: value } as Partial<Settings>)
  }

  const handleExport = async () => {
    try {
      await downloadSnapshot()
      patchSettings({ lastBackupAt: Date.now() })
      toast.success('Backup heruntergeladen')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleImport = async () => {
    const ok = await confirm.confirm({
      title: 'Backup importieren?',
      description: 'Aktuelle Daten werden ersetzt. Der Vorgang kann nicht rückgängig gemacht werden.',
      tone: 'danger',
      confirmLabel: 'Importieren',
    })
    if (!ok) return
    try {
      const result = await pickAndImport()
      toast.success(
        `Importiert: ${result.timeEntries} Einträge, ${result.projects} Projekte, ${result.tags} Tags`,
      )
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleClear = async () => {
    const ok = await confirm.confirm({
      title: 'Alle Daten löschen?',
      description:
        'Sämtliche Einträge, Projekte, Tags und Einstellungen werden entfernt. Lege vorher ein Backup an.',
      tone: 'danger',
      confirmLabel: 'Endgültig löschen',
    })
    if (!ok) return
    const db = await getDB()
    const tx = db.transaction(
      ['projects', 'tags', 'time_entries', 'invoices', 'breaks'],
      'readwrite',
    )
    await tx.objectStore('projects').clear()
    await tx.objectStore('tags').clear()
    await tx.objectStore('time_entries').clear()
    await tx.objectStore('invoices').clear()
    await tx.objectStore('breaks').clear()
    await tx.done
    window.localStorage.removeItem('zeiterfassung:settings')
    broadcast({ type: 'db-cleared' })
    toast.success('Alles gelöscht')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Einstellungen</h1>

      <Section
        title="Funktionen"
        hint="Jedes Modul lässt sich unabhängig aktivieren. Daten bleiben erhalten, wenn du etwas ausschaltest."
      >
        <div className="space-y-2">
          {CORE_FEATURES.map((f) => (
            <Toggle
              key={f.name}
              id={`feature-${f.name}`}
              icon={f.icon}
              label={f.label}
              description={f.description}
              checked={settings.features[f.name]}
              onChange={(next) => toggleFeature(f.name, next)}
            />
          ))}
        </div>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Erweitert
        </h3>
        <div className="space-y-2">
          {ADVANCED_FEATURES.map((f) => (
            <Toggle
              key={f.name}
              id={`feature-${f.name}`}
              icon={f.icon}
              label={f.label}
              description={f.description}
              checked={settings.features[f.name]}
              onChange={(next) => toggleFeature(f.name, next)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Schnell-Voreinstellung"
        hint="Setzt die Funktionen-Schalter auf das Preset einer Stufe. Bestehende Daten bleiben erhalten."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((lvl) => {
            const selected = lvl === level
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => void handleLevelClick(lvl)}
                className={`rounded-xl border-2 p-3 text-left transition-colors no-min-tap ${
                  selected
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/30'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {labelFor(lvl)}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => void applyPreset()} icon={<RotateCcw size={14} />}>
            Preset für aktuelle Stufe anwenden
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOnboardingOpen(true)} icon={<RotateCcw size={14} />}>
            Onboarding erneut durchlaufen
          </Button>
        </div>
      </Section>

      <Section title="Anzeige">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Theme">
            <Select
              value={settings.theme}
              onChange={(e) => updateField('theme', e.target.value as Settings['theme'])}
            >
              <option value="system">System</option>
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
            </Select>
          </Field>
          <Field label="Sprache & Format">
            <Select
              value={settings.locale}
              onChange={(e) => updateField('locale', e.target.value)}
            >
              <option value="de-DE">Deutsch (DE)</option>
              <option value="de-AT">Deutsch (AT)</option>
              <option value="de-CH">Deutsch (CH)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </Select>
          </Field>
          <Field label="Wochenstart">
            <Select
              value={String(settings.weekStart)}
              onChange={(e) => updateField('weekStart', Number(e.target.value) as 0 | 1)}
            >
              <option value="1">Montag</option>
              <option value="0">Sonntag</option>
            </Select>
          </Field>
        </div>
      </Section>

      {settings.features.billing && (
        <Section title="Abrechnung">
          <Toggle
            label="Neue Einträge als „abrechenbar“ markieren"
            description="Standardwert für neue Zeiteinträge. Pro Eintrag überschreibbar."
            checked={settings.defaultBillable}
            onChange={(next) => updateField('defaultBillable', next)}
          />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Standard-Stundensatz">
              <Input
                type="text"
                inputMode="decimal"
                value={settings.defaultHourlyRate?.toString() ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.')
                  const n = v === '' ? undefined : Number(v)
                  updateField('defaultHourlyRate', Number.isFinite(n!) ? n : undefined)
                }}
              />
            </Field>
            <Field label="Standard-Währung">
              <Select
                value={settings.currency}
                onChange={(e) => updateField('currency', e.target.value)}
              >
                <option value="EUR">EUR (€)</option>
                <option value="CHF">CHF</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </Field>
            <Field label="Rundung">
              <Select
                value={String(settings.roundTo)}
                onChange={(e) =>
                  updateField('roundTo', Number(e.target.value) as Settings['roundTo'])
                }
              >
                <option value="0">Keine</option>
                <option value="1">1 Minute</option>
                <option value="5">5 Minuten</option>
                <option value="15">15 Minuten</option>
                <option value="30">30 Minuten</option>
              </Select>
            </Field>
          </div>
        </Section>
      )}

      {settings.features.hoursAccount && (
        <Section title="Stundenkonto" hint="Wöchentliches Soll für die Ist/Soll-Anzeige auf der Heute-Seite.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Wochen-Soll (Stunden)" hint="z. B. 40">
              <Input
                type="text"
                inputMode="decimal"
                value={settings.targetHoursPerWeek?.toString() ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.')
                  const n = v === '' ? undefined : Number(v)
                  updateField('targetHoursPerWeek', Number.isFinite(n!) ? n : undefined)
                }}
              />
            </Field>
          </div>
        </Section>
      )}

      {settings.features.breaks && (
        <Section title="Pausen" hint="Automatische Pause nach langer Arbeitszeit (optional).">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Auto-Pause nach (Minuten)" hint="Leer = aus">
              <Input
                type="number"
                value={settings.autoBreakAfterMinutes?.toString() ?? ''}
                onChange={(e) => {
                  const n = e.target.value === '' ? undefined : Number(e.target.value)
                  updateField('autoBreakAfterMinutes', Number.isFinite(n!) ? n : undefined)
                }}
              />
            </Field>
          </div>
        </Section>
      )}

      {settings.features.pomodoro && (
        <Section title="Pomodoro" hint="Intervalle in Minuten.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Arbeit">
              <Input
                type="number"
                min={1}
                value={(settings.pomodoro?.workMinutes ?? 25).toString()}
                onChange={(e) =>
                  updateField('pomodoro', {
                    workMinutes: Number(e.target.value) || 25,
                    breakMinutes: settings.pomodoro?.breakMinutes ?? 5,
                    longBreakMinutes: settings.pomodoro?.longBreakMinutes ?? 15,
                    setsBeforeLongBreak: settings.pomodoro?.setsBeforeLongBreak ?? 4,
                  })
                }
              />
            </Field>
            <Field label="Pause">
              <Input
                type="number"
                min={1}
                value={(settings.pomodoro?.breakMinutes ?? 5).toString()}
                onChange={(e) =>
                  updateField('pomodoro', {
                    workMinutes: settings.pomodoro?.workMinutes ?? 25,
                    breakMinutes: Number(e.target.value) || 5,
                    longBreakMinutes: settings.pomodoro?.longBreakMinutes ?? 15,
                    setsBeforeLongBreak: settings.pomodoro?.setsBeforeLongBreak ?? 4,
                  })
                }
              />
            </Field>
            <Field label="Lange Pause">
              <Input
                type="number"
                min={1}
                value={(settings.pomodoro?.longBreakMinutes ?? 15).toString()}
                onChange={(e) =>
                  updateField('pomodoro', {
                    workMinutes: settings.pomodoro?.workMinutes ?? 25,
                    breakMinutes: settings.pomodoro?.breakMinutes ?? 5,
                    longBreakMinutes: Number(e.target.value) || 15,
                    setsBeforeLongBreak: settings.pomodoro?.setsBeforeLongBreak ?? 4,
                  })
                }
              />
            </Field>
            <Field label="Sets bis lange Pause">
              <Input
                type="number"
                min={1}
                value={(settings.pomodoro?.setsBeforeLongBreak ?? 4).toString()}
                onChange={(e) =>
                  updateField('pomodoro', {
                    workMinutes: settings.pomodoro?.workMinutes ?? 25,
                    breakMinutes: settings.pomodoro?.breakMinutes ?? 5,
                    longBreakMinutes: settings.pomodoro?.longBreakMinutes ?? 15,
                    setsBeforeLongBreak: Number(e.target.value) || 4,
                  })
                }
              />
            </Field>
          </div>
        </Section>
      )}

      {settings.features.invoicing && (
        <Section title="Rechnungs-Profil" hint="Wird auf erstellte Rechnungen gedruckt.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Absender-Name">
              <Input
                value={settings.invoiceProfile?.issuerName ?? ''}
                onChange={(e) => updateInvoiceProfile({ issuerName: e.target.value })}
              />
            </Field>
            <Field label="Steuersatz (%)">
              <Input
                type="text"
                inputMode="decimal"
                value={settings.invoiceProfile?.taxRate?.toString() ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.')
                  const n = v === '' ? undefined : Number(v)
                  updateInvoiceProfile({ taxRate: Number.isFinite(n!) ? n : undefined })
                }}
              />
            </Field>
            <Field label="Steuer-ID">
              <Input
                value={settings.invoiceProfile?.taxId ?? ''}
                onChange={(e) => updateInvoiceProfile({ taxId: e.target.value })}
              />
            </Field>
            <Field label="Nächste Rechnungsnummer">
              <Input
                type="number"
                value={settings.invoiceProfile?.nextInvoiceNumber ?? ''}
                onChange={(e) =>
                  updateInvoiceProfile({
                    nextInvoiceNumber: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adresse">
                <Textarea
                  value={settings.invoiceProfile?.issuerAddress ?? ''}
                  onChange={(e) => updateInvoiceProfile({ issuerAddress: e.target.value })}
                />
              </Field>
            </div>
            <Field label="IBAN">
              <Input
                value={settings.invoiceProfile?.iban ?? ''}
                onChange={(e) => updateInvoiceProfile({ iban: e.target.value })}
                placeholder="DE…"
              />
            </Field>
            <Field label="BIC">
              <Input
                value={settings.invoiceProfile?.bic ?? ''}
                onChange={(e) => updateInvoiceProfile({ bic: e.target.value })}
              />
            </Field>
            <Field label="Bank">
              <Input
                value={settings.invoiceProfile?.bankName ?? ''}
                onChange={(e) => updateInvoiceProfile({ bankName: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Zahlungs-Hinweis" hint="Optional, erscheint unter dem Zahlungsblock.">
                <Textarea
                  value={settings.invoiceProfile?.paymentNote ?? ''}
                  onChange={(e) => updateInvoiceProfile({ paymentNote: e.target.value })}
                  placeholder="z. B. Zahlbar innerhalb von 14 Tagen ohne Abzug."
                />
              </Field>
            </div>
          </div>
        </Section>
      )}

      <Section title="Daten" hint={settings.lastBackupAt ? `Letztes Backup: ${formatRelativeDay(settings.lastBackupAt, settings.locale)}` : 'Noch kein Backup angelegt.'}>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Download size={16} />} onClick={() => void handleExport()}>
            Backup herunterladen (JSON)
          </Button>
          <Button variant="secondary" icon={<Upload size={16} />} onClick={() => void handleImport()}>
            Backup importieren
          </Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => void handleClear()}>
            Alle Daten löschen
          </Button>
        </div>
      </Section>

      <Section title="Tastatur-Shortcuts">
        <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li><kbd className="kbd">Leertaste</kbd> Timer starten/stoppen</li>
          <li><kbd className="kbd">N</kbd> Neuer Eintrag</li>
          <li><kbd className="kbd">T</kbd> Heute</li>
          <li><kbd className="kbd">E</kbd> Einträge</li>
          <li><kbd className="kbd">P</kbd> Projekte</li>
          <li><kbd className="kbd">R</kbd> Reports</li>
          <li><kbd className="kbd">,</kbd> Einstellungen</li>
        </ul>
      </Section>

      <p className="text-center text-xs text-zinc-400">
        Open Source · MIT-Lizenz · Daten bleiben lokal in deinem Browser.
      </p>

      <OnboardingSheet
        open={onboardingOpen}
        initialSettings={settings}
        upgradeFrom={upgradeFrom}
        initialLevel={targetLevel}
        onClose={() => {
          setOnboardingOpen(false)
          setUpgradeFrom(undefined)
          setTargetLevel(undefined)
        }}
      />
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <header>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </header>
      {children}
    </section>
  )
}
