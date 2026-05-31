import {
  Banknote,
  BarChart3,
  Bell,
  CalendarDays,
  Coffee,
  Database,
  Download,
  FileText,
  FolderKanban,
  Gauge,
  Info,
  Keyboard,
  Laptop,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Tags as TagsIcon,
  Timer,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";
import { labelFor, OnboardingSheet } from "../components/Onboarding/OnboardingSheet";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { useConfirm } from "../components/ui/Confirm";
import { Field, Input, Select, Textarea } from "../components/ui/Input";
import { Kbd } from "../components/ui/Kbd";
import { type TabItem, Tabs } from "../components/ui/Tabs";
import { useToast } from "../components/ui/Toast";
import { Toggle } from "../components/ui/Toggle";
import { getDB } from "../lib/db";
import { broadcast } from "../lib/db/broadcast";
import { patchSettings, presetFromLevel } from "../lib/db/settings";
import { formatRelativeDay } from "../lib/format";
import { useDetailLevel } from "../lib/hooks/useDetailLevel";
import { useSettings } from "../lib/hooks/useSettings";
import { useTheme } from "../lib/hooks/useTheme";
import { downloadSnapshot } from "../lib/io/exportJson";
import { pickAndImport } from "../lib/io/importJson";
import type {
  DetailLevel,
  FeatureFlags,
  FeatureName,
  InvoiceProfile,
  Settings,
} from "../lib/types";
import { DETAIL_LEVEL_ORDER } from "../lib/types";

const LEVELS: DetailLevel[] = ["basis", "standard", "pro", "proplus"];

interface FeatureMeta {
  name: FeatureName;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CORE_FEATURES: FeatureMeta[] = [
  {
    name: "projects",
    label: "Projekte",
    description: "Einträge nach Projekten gruppieren",
    icon: <FolderKanban size={15} />,
  },
  {
    name: "tags",
    label: "Tags",
    description: "Einträge mit farbigen Tags markieren",
    icon: <TagsIcon size={15} />,
  },
  {
    name: "reports",
    label: "Reports",
    description: "Auswertungen nach Woche/Monat, CSV-Export",
    icon: <BarChart3 size={15} />,
  },
  {
    name: "billing",
    label: "Abrechnung",
    description: "Stundensätze, abrechenbar-Marker, Rundung",
    icon: <Banknote size={15} />,
  },
  {
    name: "invoicing",
    label: "Rechnungen",
    description: "Rechnungs-Vorschau, PDF-Export, Archiv",
    icon: <FileText size={15} />,
  },
];

const ADVANCED_FEATURES: FeatureMeta[] = [
  {
    name: "breaks",
    label: "Pausen",
    description: "Pausen während eines laufenden Eintrags erfassen",
    icon: <Coffee size={15} />,
  },
  {
    name: "pomodoro",
    label: "Pomodoro",
    description: "25/5-Modus für den Timer",
    icon: <Timer size={15} />,
  },
  {
    name: "notifications",
    label: "Erinnerungen",
    description: "Web-Benachrichtigungen für tägliche Reminder",
    icon: <Bell size={15} />,
  },
  {
    name: "hoursAccount",
    label: "Stundenkonto",
    description: "Wochen-Soll, Ist und Überstunden im Blick",
    icon: <Gauge size={15} />,
  },
  {
    name: "weeklyView",
    label: "Wochenübersicht",
    description: "Tagesliste Mo–So mit Summen",
    icon: <CalendarDays size={15} />,
  },
];

type Tab = "general" | "appearance" | "features" | "billing" | "data" | "about";

export function SettingsPage() {
  const { settings } = useSettings();
  const { level } = useDetailLevel();
  const toast = useToast();
  const confirm = useConfirm();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [upgradeFrom, setUpgradeFrom] = useState<DetailLevel | undefined>(undefined);
  const [targetLevel, setTargetLevel] = useState<DetailLevel | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("general");

  const handleLevelClick = async (next: DetailLevel) => {
    if (next === level) return;
    const isUpgrade = DETAIL_LEVEL_ORDER[next] > DETAIL_LEVEL_ORDER[level];
    if (isUpgrade) {
      setUpgradeFrom(level);
      setTargetLevel(next);
      setOnboardingOpen(true);
      return;
    }
    const ok = await confirm.confirm({
      title: `Auf „${labelFor(next)}“ runterstufen?`,
      description:
        "Setzt die Funktionen auf das Preset dieser Stufe zurück. Daten bleiben in der Datenbank erhalten.",
      confirmLabel: "Runterstufen",
    });
    if (!ok) return;
    patchSettings({ detailLevel: next, features: presetFromLevel(next) });
    toast.success(`Stufe: ${labelFor(next)}`);
  };

  const toggleFeature = (name: FeatureName, next: boolean) => {
    const features: FeatureFlags = { ...settings.features, [name]: next };
    patchSettings({ features });
  };

  const applyPreset = async () => {
    const ok = await confirm.confirm({
      title: `Funktionen auf „${labelFor(level)}“-Preset zurücksetzen?`,
      description: "Setzt alle Funktions-Schalter auf die Voreinstellung dieser Stufe.",
      confirmLabel: "Zurücksetzen",
    });
    if (!ok) return;
    patchSettings({ features: presetFromLevel(level) });
    toast.success("Funktionen zurückgesetzt");
  };

  const updateInvoiceProfile = (patch: Partial<InvoiceProfile>) => {
    patchSettings({
      invoiceProfile: { ...(settings.invoiceProfile ?? {}), ...patch },
    });
  };

  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    patchSettings({ [key]: value } as Partial<Settings>);
  };

  const handleExport = async () => {
    try {
      await downloadSnapshot();
      patchSettings({ lastBackupAt: Date.now() });
      toast.success("Backup heruntergeladen");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleImport = async () => {
    const ok = await confirm.confirm({
      title: "Backup importieren?",
      description:
        "Aktuelle Daten werden ersetzt. Der Vorgang kann nicht rückgängig gemacht werden.",
      tone: "danger",
      confirmLabel: "Importieren",
    });
    if (!ok) return;
    try {
      const result = await pickAndImport();
      toast.success(
        `Importiert: ${result.timeEntries} Einträge, ${result.projects} Projekte, ${result.tags} Tags`,
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleClear = async () => {
    const ok = await confirm.confirm({
      title: "Alle Daten löschen?",
      description:
        "Sämtliche Einträge, Projekte, Tags und Einstellungen werden entfernt. Lege vorher ein Backup an.",
      tone: "danger",
      confirmLabel: "Endgültig löschen",
    });
    if (!ok) return;
    const db = await getDB();
    const tx = db.transaction(
      ["projects", "tags", "time_entries", "invoices", "breaks"],
      "readwrite",
    );
    await tx.objectStore("projects").clear();
    await tx.objectStore("tags").clear();
    await tx.objectStore("time_entries").clear();
    await tx.objectStore("invoices").clear();
    await tx.objectStore("breaks").clear();
    await tx.done;
    window.localStorage.removeItem("zeiterfassung:settings");
    broadcast({ type: "db-cleared" });
    toast.success("Alles gelöscht");
  };

  const tabs: TabItem<Tab>[] = [
    { value: "general", label: "Allgemein", icon: <User size={14} /> },
    { value: "appearance", label: "Erscheinung", icon: <Palette size={14} /> },
    { value: "features", label: "Funktionen", icon: <Gauge size={14} /> },
    ...(settings.features.billing || settings.features.invoicing
      ? [{ value: "billing" as Tab, label: "Abrechnung", icon: <Banknote size={14} /> }]
      : []),
    { value: "data", label: "Daten", icon: <Database size={14} /> },
    { value: "about", label: "Info", icon: <Info size={14} /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[color:var(--color-text-1)]">
          Einstellungen
        </h1>
        <p className="mt-0.5 text-sm text-[color:var(--color-text-3)]">
          Funktionen, Erscheinung und Daten.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[200px_1fr]">
        <aside>
          <div className="hidden md:block">
            <Tabs
              items={tabs}
              value={tab}
              onChange={setTab}
              orientation="vertical"
              ariaLabel="Einstellungen-Navigation"
            />
          </div>
          <div className="md:hidden">
            <Tabs
              items={tabs.map((t) => ({ value: t.value, label: t.label }))}
              value={tab}
              onChange={setTab}
              ariaLabel="Einstellungen-Navigation"
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {tab === "general" && (
            <>
              <Card padding="md">
                <CardHeader
                  title="Sprache & Region"
                  description="Wie Zeiten und Beträge formatiert werden."
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Sprache & Format">
                    <Select
                      value={settings.locale}
                      onChange={(e) => updateField("locale", e.target.value)}
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
                      onChange={(e) => updateField("weekStart", Number(e.target.value) as 0 | 1)}
                    >
                      <option value="1">Montag</option>
                      <option value="0">Sonntag</option>
                    </Select>
                  </Field>
                </div>
              </Card>

              {settings.features.hoursAccount && (
                <Card padding="md">
                  <CardHeader
                    title="Stundenkonto"
                    description="Wöchentliches Soll für die Ist/Soll-Anzeige."
                  />
                  <Field label="Wochen-Soll (Stunden)" hint="z. B. 40">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={settings.targetHoursPerWeek?.toString() ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".");
                        const n = v === "" ? undefined : Number(v);
                        updateField("targetHoursPerWeek", Number.isFinite(n!) ? n : undefined);
                      }}
                    />
                  </Field>
                </Card>
              )}

              {settings.features.breaks && (
                <Card padding="md">
                  <CardHeader
                    title="Pausen"
                    description="Automatische Pause nach langer Arbeitszeit."
                  />
                  <Field label="Auto-Pause nach (Minuten)" hint="Leer = aus">
                    <Input
                      type="number"
                      value={settings.autoBreakAfterMinutes?.toString() ?? ""}
                      onChange={(e) => {
                        const n = e.target.value === "" ? undefined : Number(e.target.value);
                        updateField("autoBreakAfterMinutes", Number.isFinite(n!) ? n : undefined);
                      }}
                    />
                  </Field>
                </Card>
              )}

              {settings.features.pomodoro && (
                <Card padding="md">
                  <CardHeader title="Pomodoro" description="Intervalle in Minuten." />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field label="Arbeit">
                      <Input
                        type="number"
                        min={1}
                        value={(settings.pomodoro?.workMinutes ?? 25).toString()}
                        onChange={(e) =>
                          updateField("pomodoro", {
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
                          updateField("pomodoro", {
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
                          updateField("pomodoro", {
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
                          updateField("pomodoro", {
                            workMinutes: settings.pomodoro?.workMinutes ?? 25,
                            breakMinutes: settings.pomodoro?.breakMinutes ?? 5,
                            longBreakMinutes: settings.pomodoro?.longBreakMinutes ?? 15,
                            setsBeforeLongBreak: Number(e.target.value) || 4,
                          })
                        }
                      />
                    </Field>
                  </div>
                </Card>
              )}
            </>
          )}

          {tab === "appearance" && (
            <Card padding="md">
              <CardHeader
                title="Thema"
                description="Hell, dunkel oder am Systemeinstellungen orientieren."
              />
              <ThemePicker />
            </Card>
          )}

          {tab === "features" && (
            <>
              <Card padding="md">
                <CardHeader
                  title="Stufen-Voreinstellung"
                  description="Schaltet schnell ein Bündel von Funktionen ein."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void applyPreset()}
                      icon={<RotateCcw size={12} />}
                    >
                      Preset anwenden
                    </Button>
                  }
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LEVELS.map((lvl) => {
                    const selected = lvl === level;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => void handleLevelClick(lvl)}
                        className={`rounded-md border p-3 text-left transition-colors no-min-tap ${
                          selected
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                            : "border-[color:var(--color-border-subtle)] hover:border-[color:var(--color-border-strong)]"
                        }`}
                      >
                        <div className="text-sm font-semibold text-[color:var(--color-text-1)]">
                          {labelFor(lvl)}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(true)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-[color:var(--color-text-3)] underline-offset-2 hover:text-[color:var(--color-text-1)] hover:underline no-min-tap"
                >
                  <RotateCcw size={11} /> Onboarding erneut durchlaufen
                </button>
              </Card>

              <Card padding="md">
                <CardHeader
                  title="Kern-Funktionen"
                  description="Daten bleiben erhalten, wenn du etwas ausschaltest."
                />
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
              </Card>

              <Card padding="md">
                <CardHeader title="Erweiterte Funktionen" />
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
              </Card>
            </>
          )}

          {tab === "billing" && (
            <>
              {settings.features.billing && (
                <Card padding="md">
                  <CardHeader
                    title="Abrechnung"
                    description="Defaults für Stundensatz und Rundung."
                  />
                  <div className="space-y-4">
                    <Toggle
                      label="Neue Einträge als „abrechenbar“ markieren"
                      description="Standardwert für neue Zeiteinträge."
                      checked={settings.defaultBillable}
                      onChange={(next) => updateField("defaultBillable", next)}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Standard-Stundensatz">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={settings.defaultHourlyRate?.toString() ?? ""}
                          onChange={(e) => {
                            const v = e.target.value.replace(",", ".");
                            const n = v === "" ? undefined : Number(v);
                            updateField("defaultHourlyRate", Number.isFinite(n!) ? n : undefined);
                          }}
                        />
                      </Field>
                      <Field label="Standard-Währung">
                        <Select
                          value={settings.currency}
                          onChange={(e) => updateField("currency", e.target.value)}
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
                            updateField("roundTo", Number(e.target.value) as Settings["roundTo"])
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
                  </div>
                </Card>
              )}

              {settings.features.invoicing && (
                <Card padding="md">
                  <CardHeader
                    title="Rechnungs-Profil"
                    description="Wird auf erstellte Rechnungen gedruckt."
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Absender-Name">
                      <Input
                        value={settings.invoiceProfile?.issuerName ?? ""}
                        onChange={(e) => updateInvoiceProfile({ issuerName: e.target.value })}
                      />
                    </Field>
                    <Field label="Steuersatz (%)">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={settings.invoiceProfile?.taxRate?.toString() ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.replace(",", ".");
                          const n = v === "" ? undefined : Number(v);
                          updateInvoiceProfile({
                            taxRate: Number.isFinite(n!) ? n : undefined,
                          });
                        }}
                      />
                    </Field>
                    <Field label="Steuer-ID">
                      <Input
                        value={settings.invoiceProfile?.taxId ?? ""}
                        onChange={(e) => updateInvoiceProfile({ taxId: e.target.value })}
                      />
                    </Field>
                    <Field label="Nächste Rechnungsnummer">
                      <Input
                        type="number"
                        value={settings.invoiceProfile?.nextInvoiceNumber ?? ""}
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
                          value={settings.invoiceProfile?.issuerAddress ?? ""}
                          onChange={(e) =>
                            updateInvoiceProfile({
                              issuerAddress: e.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <Field label="IBAN">
                      <Input
                        value={settings.invoiceProfile?.iban ?? ""}
                        onChange={(e) => updateInvoiceProfile({ iban: e.target.value })}
                        placeholder="DE…"
                      />
                    </Field>
                    <Field label="BIC">
                      <Input
                        value={settings.invoiceProfile?.bic ?? ""}
                        onChange={(e) => updateInvoiceProfile({ bic: e.target.value })}
                      />
                    </Field>
                    <Field label="Bank">
                      <Input
                        value={settings.invoiceProfile?.bankName ?? ""}
                        onChange={(e) => updateInvoiceProfile({ bankName: e.target.value })}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field
                        label="Zahlungs-Hinweis"
                        hint="Optional, erscheint unter dem Zahlungsblock."
                      >
                        <Textarea
                          value={settings.invoiceProfile?.paymentNote ?? ""}
                          onChange={(e) => updateInvoiceProfile({ paymentNote: e.target.value })}
                          placeholder="z. B. Zahlbar innerhalb von 14 Tagen ohne Abzug."
                        />
                      </Field>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          {tab === "data" && (
            <Card padding="md">
              <CardHeader
                title="Daten"
                description={
                  settings.lastBackupAt
                    ? `Letztes Backup: ${formatRelativeDay(settings.lastBackupAt, settings.locale)}`
                    : "Noch kein Backup angelegt."
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  icon={<Download size={14} />}
                  onClick={() => void handleExport()}
                >
                  Backup herunterladen
                </Button>
                <Button
                  variant="outline"
                  icon={<Upload size={14} />}
                  onClick={() => void handleImport()}
                >
                  Backup importieren
                </Button>
                <Button
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => void handleClear()}
                >
                  Alle Daten löschen
                </Button>
              </div>
              <p className="mt-4 text-xs text-[color:var(--color-text-3)]">
                Backups sind reine JSON-Dateien. Sie enthalten alle deine Einträge, Projekte, Tags
                und Einstellungen — und nichts darüber hinaus.
              </p>
            </Card>
          )}

          {tab === "about" && (
            <>
              <Card padding="md">
                <CardHeader
                  title="Tastatur-Shortcuts"
                  action={<Keyboard size={14} className="text-[color:var(--color-text-3)]" />}
                />
                <ul className="space-y-2 text-sm">
                  <ShortcutRow keyLabel="⌘ K" label="Befehlsmenü" />
                  <ShortcutRow keyLabel="Leer." label="Timer Start/Stop" />
                  <ShortcutRow keyLabel="N" label="Neuer Eintrag" />
                  <ShortcutRow keyLabel="T" label="Heute" />
                  <ShortcutRow keyLabel="E" label="Einträge" />
                  <ShortcutRow keyLabel="P" label="Projekte" />
                  <ShortcutRow keyLabel="R" label="Reports" />
                  <ShortcutRow keyLabel="," label="Einstellungen" />
                  <ShortcutRow keyLabel="?" label="Diese Übersicht" />
                </ul>
              </Card>

              <Card padding="md">
                <CardHeader title="Über" />
                <p className="text-sm text-[color:var(--color-text-2)]">
                  Zeiterfassung — Open Source, MIT-Lizenz. Alle Daten bleiben lokal in deinem
                  Browser, kein Account, kein Tracking.
                </p>
              </Card>
            </>
          )}
        </div>
      </div>

      <OnboardingSheet
        open={onboardingOpen}
        initialSettings={settings}
        upgradeFrom={upgradeFrom}
        initialLevel={targetLevel}
        onClose={() => {
          setOnboardingOpen(false);
          setUpgradeFrom(undefined);
          setTargetLevel(undefined);
        }}
      />
    </div>
  );
}

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, label: "Hell", Icon: Sun },
    { value: "dark" as const, label: "Dunkel", Icon: Moon },
    { value: "system" as const, label: "System", Icon: Laptop },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const Icon = opt.Icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`flex flex-col items-center gap-2 rounded-md border p-3 transition-colors no-min-tap ${
              active
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                : "border-[color:var(--color-border-subtle)] hover:border-[color:var(--color-border-strong)]"
            }`}
          >
            <Icon size={18} className="text-[color:var(--color-text-2)]" />
            <span className="text-xs font-medium text-[color:var(--color-text-1)]">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ShortcutRow({ keyLabel, label }: { keyLabel: string; label: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-[color:var(--color-text-2)]">{label}</span>
      <Kbd>{keyLabel}</Kbd>
    </li>
  );
}
