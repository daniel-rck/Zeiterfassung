import type { DetailLevel, FeatureFlags, InvoiceProfile, Settings } from "../types";
import { DETAIL_LEVEL_ORDER } from "../types";
import { broadcast } from "./broadcast";

const KEY = "zeiterfassung:settings";

export function presetFromLevel(level: DetailLevel): FeatureFlags {
  const order = DETAIL_LEVEL_ORDER[level];
  return {
    projects: order >= DETAIL_LEVEL_ORDER.standard,
    tags: order >= DETAIL_LEVEL_ORDER.pro,
    reports: order >= DETAIL_LEVEL_ORDER.standard,
    billing: order >= DETAIL_LEVEL_ORDER.pro,
    invoicing: order >= DETAIL_LEVEL_ORDER.proplus,
    breaks: false,
    pomodoro: false,
    notifications: false,
    hoursAccount: false,
    weeklyView: false,
  };
}

export const DEFAULT_SETTINGS: Settings = {
  detailLevel: "standard",
  onboardingCompleted: false,
  defaultBillable: false,
  currency: "EUR",
  locale: "de-DE",
  weekStart: 1,
  theme: "system",
  roundTo: 0,
  features: presetFromLevel("standard"),
};

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readSettings(): Settings {
  const ls = safeStorage();
  if (!ls) return { ...DEFAULT_SETTINGS };
  const raw = ls.getItem(KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const level = parsed.detailLevel ?? DEFAULT_SETTINGS.detailLevel;
    const features: FeatureFlags = { ...presetFromLevel(level), ...(parsed.features ?? {}) };
    return { ...DEFAULT_SETTINGS, ...parsed, features };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: Settings): void {
  const ls = safeStorage();
  if (!ls) return;
  ls.setItem(KEY, JSON.stringify(settings));
  broadcast({ type: "settings-changed" });
}

export function patchSettings(patch: Partial<Settings>): Settings {
  const next = { ...readSettings(), ...patch };
  writeSettings(next);
  return next;
}

export function setDetailLevel(level: DetailLevel): Settings {
  return patchSettings({ detailLevel: level });
}

export function setInvoiceProfile(profile: InvoiceProfile | undefined): Settings {
  return patchSettings({ invoiceProfile: profile });
}

// Idempotent counter bump that re-reads the latest state before writing.
// Two tabs that both used the same suggested number end up with the same
// `nextInvoiceNumber` afterwards, never lower — protecting against rolling
// the counter backwards in race conditions.
export function bumpInvoiceNumberTo(atLeast: number): Settings {
  const current = readSettings();
  const profile = current.invoiceProfile ?? {};
  const currentNext = profile.nextInvoiceNumber ?? 0;
  if (atLeast <= currentNext) return current;
  return patchSettings({ invoiceProfile: { ...profile, nextInvoiceNumber: atLeast } });
}
