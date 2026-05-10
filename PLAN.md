# Zeiterfassung — Lebende Roadmap

## Naming

| | |
|---|---|
| App-Name (UI) | Zeiterfassung |
| Repo | `daniel-rck/Zeiterfassung` |
| Worker | `zeiterfassung` |
| Domain | `zeiterfassung.daniel-rck.workers.dev` |
| DB-Name (IndexedDB) | `zeiterfassung` |
| Settings-Key (localStorage) | `zeiterfassung:settings` |
| BroadcastChannel | `zeiterfassung-db` |

## Designprinzip

Eine einzige App, vier Tiefen-Stufen. Der User wählt im Onboarding, wie weit er erfassen will — und kann die Stufe jederzeit ändern. Ausgeblendete Felder bleiben in der DB erhalten und tauchen beim Hochstufen wieder auf.

| Stufe | Sichtbar | Versteckt |
|---|---|---|
| **Basis** | Timer, Beschreibung, Tagesliste, JSON-Backup | Projekte, Tags, billable, Stundensätze, Reports, Invoice |
| **Standard** | + Projekte (Name, Farbe), Reports, CSV-Export | Tags, billable, Stundensätze, Invoice, Rundung |
| **Pro** | + Tags, billable, Stundensätze pro Projekt, Beträge, Rundung | Invoice |
| **Pro+** | + Rechnungs-Vorschau, PDF-Export, Rechnungs-Profil | – |

Geregelt über `useDetailLevel()` und `<Gated level="pro">…</Gated>` (`src/components/Gated.tsx`).

## Tech-Stack

| Bereich | Wahl |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 mit `@theme`-Block |
| PWA | `vite-plugin-pwa` (`injectManifest`, eigener Service Worker) |
| Routing | `react-router-dom` v7 (BrowserRouter) |
| Storage | IndexedDB via `idb`, Settings in `localStorage`, Multi-Tab-Sync via `BroadcastChannel` |
| IDs | `ulid` |
| PDF | `jspdf` (lazy-importiert in `lib/invoice/pdf.ts`) |
| Icons | `lucide-react` |
| Tests | Vitest + Testing Library |
| Hosting | Cloudflare Workers + Static Assets |
| Package Manager | Bun |

## Datenmodell

```ts
type DetailLevel = 'basis' | 'standard' | 'pro' | 'proplus'

type Project = {
  id: string                 // ulid
  name: string
  client?: string
  color: string
  hourlyRate?: number
  currency?: string
  billableDefault: boolean
  archived: boolean
  createdAt: number
  updatedAt: number
}

type Tag = {
  id: string
  name: string
  color: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

type TimeEntry = {
  id: string
  projectId?: string         // optional → "ohne Projekt"
  description: string
  startedAt: number
  endedAt?: number           // undefined = laufender Timer
  durationSec: number
  billable: boolean
  tagIds: string[]
  notes?: string
  hourlyRateSnapshot?: number
  currencySnapshot?: string
  createdAt: number
  updatedAt: number
}

type Settings = {
  detailLevel: DetailLevel
  onboardingCompleted: boolean
  defaultBillable: boolean
  defaultHourlyRate?: number
  currency: string
  locale: string
  weekStart: 0 | 1
  theme: 'system' | 'light' | 'dark'
  roundTo: 0 | 1 | 5 | 15 | 30
  invoiceProfile?: { issuerName?: string; issuerAddress?: string; taxRate?: number; taxId?: string; nextInvoiceNumber?: number }
  lastBackupAt?: number
}
```

**IndexedDB-Schema** (DB `zeiterfassung`, Version 1):
- `projects` – key `id`, indexes `byName`, `byArchived`
- `tags` – key `id`, indexes `byName`
- `time_entries` – key `id`, indexes `byProjectId`, `byStartedAt`, `byStartedAtDay`, `byRunning`

## Phasen

- **Phase 0 — Setup** ✅ Vite + React 19 + TS + Tailwind 4 + PWA + Vitest + Worker + CI
- **Phase 1 — DB & Hooks** ✅ Schema, CRUD-Module (`projects.ts`, `tags.ts`, `timeEntries.ts`, `settings.ts`), `BroadcastChannel`-Sync, Hooks (`useProjects`, `useTags`, `useEntries`, `useRunningEntry`, `useSettings`, `useDetailLevel`, `useTheme`)
- **Phase 1.5 — Onboarding & Detail-Stufen** ✅ 4-Schritte-Sheet (`OnboardingSheet.tsx`), `<Gated>`-Component, automatisches Öffnen wenn `!onboardingCompleted`, Stufenwechsel in Settings (Hochstufen → Sub-Flow für neue Felder, Runterstufen → Bestätigung, Daten bleiben)
- **Phase 2 — Timer & Einträge** ✅ `startTimer`/`stopTimer`/`getRunningEntry`, `useRunningEntry` mit Live-Tick, `TimerHero`, `EntryCard`, `DayGroup`, `pages/Today.tsx`, `pages/Entries.tsx`, `pages/EntryEdit.tsx`, `DurationInput` mit Multi-Format-Parser
- **Phase 3 — Projekte & Tags** ✅ `pages/Projects.tsx` & `pages/Tags.tsx` mit CRUD, Soft-Delete (Archive), Quick-Create im `ProjectPicker`/`TagPicker`
- **Phase 4 — Reports** ✅ `pages/Reports.tsx`, `ReportFilters`, `ReportChart` (SVG-Bars), Aggregation per Tag/Projekt/Tag-Label, CSV-Export
- **Phase 5 — Rechnung & PDF** ✅ `pages/Invoice.tsx` mit Vorschau + Print-CSS + jspdf-PDF, `lib/invoice/compose.ts`, fortlaufende Rechnungsnummern in Settings
- **Phase 6 — Polish** ✅ `lib/keyboard/shortcuts.ts` + `GlobalShortcuts`, A11y-Touch-Targets (44×44), `prefers-reduced-motion`, Skip-Link, Backup-Reminder in Settings (letztes Backup mit Datum)

## Cross-Cutting

- **Privatsphäre**: Keine Cookies, keine Analytics, keine Server-Calls außer für Static Assets. PWA cached die App offline, alle Daten in IndexedDB.
- **Multi-Tab**: `BroadcastChannel('zeiterfassung-db')` synchronisiert alle offenen Tabs sofort (DB-Schreibvorgänge → Refresh aller Hooks).
- **iOS PWA**: `viewport-fit=cover`, Touch-Targets ≥ 44px, `injectManifest` lädt Workbox-Precache.
- **Error-Boundaries**: `useToast()` für UX-Errors, sonst werfen die DB-Calls — UI behandelt mit `try/catch`.
- **A11y**: Skip-Link, semantisches HTML, ARIA-Labels auf Icon-Buttons, Focus-Visible-Styling.

## Out of Scope

- Keine Accounts, kein Cloud-Sync, keine Server-Persistenz
- Keine Multi-User-/Team-Funktionen
- Keine native App
- Keine Pomodoro-/Idle-Detection (potenzielle Phase 7)
- Keine Auto-Tracking-Heuristik (App-/Window-Erkennung)
- Keine integrierten Bezahlungs-/Mahn-Funktionen
