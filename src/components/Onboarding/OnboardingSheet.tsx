import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { patchSettings, presetFromLevel } from "../../lib/db/settings";
import type { DetailLevel, InvoiceProfile, Settings } from "../../lib/types";
import { DETAIL_LEVEL_ORDER } from "../../lib/types";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Input";
import { Sheet } from "../ui/Sheet";
import { useToast } from "../ui/Toast";

interface LevelDescriptor {
  level: DetailLevel;
  title: string;
  tagline: string;
  features: string[];
}

const LEVELS: LevelDescriptor[] = [
  {
    level: "basis",
    title: "Basis",
    tagline: "Stunden grob mitschreiben",
    features: ["Timer mit Beschreibung", "Tagesliste & Tagessumme", "JSON-Export für Backup"],
  },
  {
    level: "standard",
    title: "Standard",
    tagline: "Sehen, wofür Zeit draufgeht",
    features: ["Alles aus Basis", "Projekte mit Farbe", "Reports nach Woche/Monat", "CSV-Export"],
  },
  {
    level: "pro",
    title: "Pro",
    tagline: "Auf Stundenbasis abrechnen",
    features: [
      "Alles aus Standard",
      "Tags & abrechenbar-Marker",
      "Stundensätze pro Projekt",
      "Beträge in Reports",
      "Rundung",
    ],
  },
  {
    level: "proplus",
    title: "Pro+",
    tagline: "Echte Rechnungen erstellen",
    features: ["Alles aus Pro", "Rechnungs-Vorschau", "PDF-Export", "Rechnungs-Profil mit Steuer"],
  },
];

interface ConfigDraft {
  locale: string;
  weekStart: 0 | 1;
  theme: "system" | "light" | "dark";
  defaultBillable: boolean;
  defaultHourlyRate?: string;
  currency: string;
  roundTo: 0 | 1 | 5 | 15 | 30;
  invoiceProfile: InvoiceProfile;
}

function defaultConfig(settings: Settings): ConfigDraft {
  return {
    locale: settings.locale,
    weekStart: settings.weekStart,
    theme: settings.theme,
    defaultBillable: settings.defaultBillable,
    defaultHourlyRate: settings.defaultHourlyRate != null ? String(settings.defaultHourlyRate) : "",
    currency: settings.currency,
    roundTo: settings.roundTo,
    invoiceProfile: settings.invoiceProfile ?? {},
  };
}

export interface OnboardingSheetProps {
  open: boolean;
  initialSettings: Settings;
  /** When true, only walk through fields that are new for the target level. */
  upgradeFrom?: DetailLevel;
  /** Pre-select target level (used when upgrading). */
  initialLevel?: DetailLevel;
  onClose: (completed: boolean) => void;
}

export function OnboardingSheet({
  open,
  initialSettings,
  upgradeFrom,
  initialLevel,
  onClose,
}: OnboardingSheetProps) {
  const isUpgrade = upgradeFrom != null;
  const [step, setStep] = useState(isUpgrade ? 1 : 0);
  const [level, setLevel] = useState<DetailLevel>(initialLevel ?? initialSettings.detailLevel);
  const [config, setConfig] = useState<ConfigDraft>(() => defaultConfig(initialSettings));
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setStep(isUpgrade ? 1 : 0);
      setLevel(initialLevel ?? initialSettings.detailLevel);
      setConfig(defaultConfig(initialSettings));
    }
  }, [open, isUpgrade, initialLevel, initialSettings]);

  const totalSteps = useMemo(() => (isUpgrade ? 2 : 4), [isUpgrade]);

  const finish = () => {
    const patch: Partial<Settings> = {
      detailLevel: level,
      onboardingCompleted: true,
      locale: config.locale,
      weekStart: config.weekStart,
      theme: config.theme,
      features: presetFromLevel(level),
    };
    if (DETAIL_LEVEL_ORDER[level] >= DETAIL_LEVEL_ORDER.pro) {
      patch.defaultBillable = config.defaultBillable;
      patch.currency = config.currency;
      patch.roundTo = config.roundTo;
      const rate = config.defaultHourlyRate
        ? Number(config.defaultHourlyRate.replace(",", "."))
        : NaN;
      patch.defaultHourlyRate = Number.isFinite(rate) ? rate : undefined;
    }
    if (DETAIL_LEVEL_ORDER[level] >= DETAIL_LEVEL_ORDER.proplus) {
      patch.invoiceProfile = config.invoiceProfile;
    }
    patchSettings(patch);
    toast.success(isUpgrade ? `Detail-Tiefe: ${labelFor(level)}` : "Willkommen bei Zeiterfassung");
    onClose(true);
  };

  const showProConfig = DETAIL_LEVEL_ORDER[level] >= DETAIL_LEVEL_ORDER.pro;
  const showProPlusConfig = DETAIL_LEVEL_ORDER[level] >= DETAIL_LEVEL_ORDER.proplus;
  const showStandardConfig = DETAIL_LEVEL_ORDER[level] >= DETAIL_LEVEL_ORDER.standard;

  // Skip configure step if upgrading to a level that has nothing new to configure
  const hasNewFields = (() => {
    if (!isUpgrade) return true;
    const from = upgradeFrom;
    const fromOrder = DETAIL_LEVEL_ORDER[from];
    const toOrder = DETAIL_LEVEL_ORDER[level];
    if (toOrder <= fromOrder) return false;
    if (toOrder >= DETAIL_LEVEL_ORDER.pro && fromOrder < DETAIL_LEVEL_ORDER.pro) return true;
    if (toOrder >= DETAIL_LEVEL_ORDER.proplus && fromOrder < DETAIL_LEVEL_ORDER.proplus)
      return true;
    return false;
  })();

  const currentStepIndex = isUpgrade ? step - 1 : step;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  const skipOnboarding = () => {
    patchSettings({ onboardingCompleted: true });
    onClose(false);
  };

  return (
    <Sheet
      open={open}
      onClose={skipOnboarding}
      closeable={!isUpgrade}
      title={isUpgrade ? "Detail-Tiefe ändern" : "Willkommen bei Zeiterfassung"}
      size="md"
    >
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Schritt {Math.min(currentStepIndex + 1, totalSteps)} von {totalSteps}
          </span>
          <span>
            {step === 0 && !isUpgrade && "Begrüßung"}
            {step === 1 && "Tiefe wählen"}
            {step === 2 && "Konfiguration"}
            {step === 3 && "Fertig"}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStepIndex + 1}
          className="h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-brand-50 p-4 dark:bg-brand-950/30">
            <Sparkles className="mt-0.5 text-brand-600" size={20} />
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Zeiterfassung — schlicht, lokal, ohne Account.
              </p>
              <p className="mt-1">
                Nimm Stunden auf, ordne sie Projekten zu, exportiere Reports oder Rechnungen. Tiefe
                wählst du selbst — und kannst sie jederzeit ändern.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <Lock className="mt-0.5 text-zinc-500" size={20} />
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">100 % lokal</p>
              <p className="mt-1">
                Alle Daten bleiben in deinem Browser (IndexedDB). Kein Konto, kein Tracking, keine
                Cloud — bis du selbst exportierst.
              </p>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={skipOnboarding}>
              Überspringen
            </Button>
            <Button variant="primary" onClick={() => setStep(1)} icon={<ArrowRight size={16} />}>
              Weiter
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Wie tief willst du erfassen? Du kannst später jederzeit hoch- oder runterstufen.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LEVELS.map((descriptor) => {
              const selected = level === descriptor.level;
              return (
                <button
                  key={descriptor.level}
                  type="button"
                  onClick={() => setLevel(descriptor.level)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-colors no-min-tap ${
                    selected
                      ? "border-brand-600 bg-brand-50 dark:bg-brand-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 rounded-full bg-brand-600 p-1 text-white">
                      <Check size={12} />
                    </span>
                  )}
                  <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {descriptor.title}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">{descriptor.tagline}</div>
                  <ul className="mt-3 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {descriptor.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-1">
                        <Check size={12} className="mt-0.5 flex-shrink-0 text-brand-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between pt-2">
            {!isUpgrade && (
              <Button variant="ghost" onClick={() => setStep(0)}>
                Zurück
              </Button>
            )}
            <div className="ml-auto">
              <Button
                variant="primary"
                onClick={() => {
                  if (!hasNewFields) {
                    finish();
                  } else if (DETAIL_LEVEL_ORDER[level] === 0) {
                    setStep(2);
                  } else {
                    setStep(2);
                  }
                }}
                icon={<ArrowRight size={16} />}
              >
                Weiter
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ein paar Standardwerte. Du kannst sie später in den Einstellungen ändern.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Sprache & Format">
              <Select
                value={config.locale}
                onChange={(e) => setConfig({ ...config, locale: e.target.value })}
              >
                <option value="de-DE">Deutsch (Deutschland)</option>
                <option value="de-AT">Deutsch (Österreich)</option>
                <option value="de-CH">Deutsch (Schweiz)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </Select>
            </Field>
            <Field label="Wochenstart">
              <Select
                value={String(config.weekStart)}
                onChange={(e) =>
                  setConfig({ ...config, weekStart: Number(e.target.value) as 0 | 1 })
                }
              >
                <option value="1">Montag</option>
                <option value="0">Sonntag</option>
              </Select>
            </Field>
            <Field label="Theme">
              <Select
                value={config.theme}
                onChange={(e) =>
                  setConfig({ ...config, theme: e.target.value as ConfigDraft["theme"] })
                }
              >
                <option value="system">System</option>
                <option value="light">Hell</option>
                <option value="dark">Dunkel</option>
              </Select>
            </Field>
            {showStandardConfig && (
              <Field label="Standard-Währung" hint="Für Stundensätze und Reports">
                <Select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="CHF">CHF</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </Select>
              </Field>
            )}

            {showProConfig && (
              <>
                <Field
                  label="Standard-Stundensatz"
                  hint="Optional — kann pro Projekt überschrieben werden"
                >
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="z. B. 90"
                    value={config.defaultHourlyRate ?? ""}
                    onChange={(e) => setConfig({ ...config, defaultHourlyRate: e.target.value })}
                  />
                </Field>
                <Field label="Rundung" hint="Bei Reports und Rechnungen">
                  <Select
                    value={String(config.roundTo)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        roundTo: Number(e.target.value) as ConfigDraft["roundTo"],
                      })
                    }
                  >
                    <option value="0">Keine</option>
                    <option value="1">1 Minute</option>
                    <option value="5">5 Minuten</option>
                    <option value="15">15 Minuten</option>
                    <option value="30">30 Minuten</option>
                  </Select>
                </Field>
              </>
            )}
          </div>

          {showProPlusConfig && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Rechnungs-Profil
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Absender-Name">
                  <Input
                    value={config.invoiceProfile.issuerName ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        invoiceProfile: { ...config.invoiceProfile, issuerName: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Steuersatz (%)" hint="Z. B. 19 oder 0">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={config.invoiceProfile.taxRate?.toString() ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(",", ".");
                      const n = v === "" ? undefined : Number(v);
                      setConfig({
                        ...config,
                        invoiceProfile: {
                          ...config.invoiceProfile,
                          taxRate: Number.isFinite(n!) ? n : undefined,
                        },
                      });
                    }}
                  />
                </Field>
                <Field label="Steuer-ID / USt-IdNr." hint="Optional">
                  <Input
                    value={config.invoiceProfile.taxId ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        invoiceProfile: { ...config.invoiceProfile, taxId: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Adresse">
                  <Textarea
                    value={config.invoiceProfile.issuerAddress ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        invoiceProfile: { ...config.invoiceProfile, issuerAddress: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button
              variant="primary"
              onClick={() => (isUpgrade ? finish() : setStep(3))}
              icon={<ArrowRight size={16} />}
            >
              {isUpgrade ? "Übernehmen" : "Weiter"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 p-4 text-sm text-zinc-700 dark:bg-brand-950/30 dark:text-zinc-300">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Fertig! 🎉</p>
            <p className="mt-1">
              Du startest mit der Stufe <strong>{labelFor(level)}</strong>. Tipp: Den großen
              Start-Knopf auf der Heute-Seite drückt man auch mit der Leertaste.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={finish}>
              Loslegen
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function labelFor(level: DetailLevel): string {
  return LEVELS.find((l) => l.level === level)?.title ?? level;
}
