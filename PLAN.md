# Deep Fixup — Session-Plan (2026-06-10)

> Ausführungs-Plan und Protokoll der Deep-Fixup-Session. Die lebende
> Produkt-Roadmap ist nach [docs/ROADMAP.md](./docs/ROADMAP.md) umgezogen.

**Baseline bei Start:** Build ✅ · 52/52 Tests ✅ · Typecheck ✅ · Lint ✅ (28 Warnungen)

**Verifikation (gesamte Session):**

```bash
bun run build && bun run test && bun run typecheck && bun run lint
```

**Constraints:** `src/lib/ui/*` und `src/lib/db/useLiveQuery.ts` sind byte-identisch
aus web-base übernommen und bleiben unangetastet (siehe `docs/specs/00-overview.md`).
Worker-CSP, doppelte Token-Sets und die `!important`-Regeln für
`prefers-reduced-motion`/Print sind bewusste Entscheidungen.

## Tasks

- [x] T0: migrate biome.json schema to installed CLI 2.4.16
      Files: biome.json
      Change: bun löste `^2.4.15` zu 2.4.16 auf; der alte Schema-Pin ließ `biome check` an der Config scheitern.
      Verify: `bun run lint`

- [x] T1: stopTimer ends a running break (root-cause fix)
      Files: src/lib/db/timeEntries.ts, src/components/TimerHero.tsx, src/test/setup.ts, src/lib/db/__tests__/breaks.test.ts (neu)
      Change: Stop über Space-Shortcut oder Command-Palette ließ eine laufende Pause ewig weiterlaufen und zählte ihre Zeit als Arbeit (nur TimerHero beendete sie vorab). `stopTimer()` beendet die laufende Pause jetzt selbst; TimerHero verliert den redundanten Aufruf. Test-Setup leert nun auch den `breaks`-Store.
      Verify: `bun run test` (neue breaks-Tests, inkl. Stop mitten in der Pause)

- [x] T2: include breaks in JSON backup export/import
      Files: src/lib/io/exportJson.ts, src/lib/io/importJson.ts, src/lib/io/__tests__/importJson.test.ts
      Change: Backups verloren Pausen-Daten still (Export ließ `breaks` aus, Import leerte/restaurierte den Store nicht — Re-Import hinterließ veraltete Pausen an wiederhergestellten Eintrags-IDs). Snapshots enthalten jetzt `breaks` (validiert); alte Backups ohne Feld importieren als leer.
      Verify: `bun run test` (Roundtrip-, Legacy- und Validierungs-Tests)

- [x] T3: make startTimer's running-check atomic
      Files: src/lib/db/timeEntries.ts
      Change: Check-then-add lief über zwei Transaktionen — zwei Tabs konnten gleichzeitig starten und zwei laufende Einträge anlegen. Check und Add teilen sich jetzt eine readwrite-Transaktion.
      Verify: `bun run test` (timer.test.ts „läuft bereits“)

- [x] T4: tighten backup import validation
      Files: src/lib/io/importJson.ts, src/lib/io/__tests__/importJson.test.ts
      Change: validateEntry prüft jetzt zusätzlich durationSec (endliche Zahl ≥ 0), description (string) und billable (boolean) — vorher konnte eine defekte Datei `undefined`-Dauern importieren (NaN in allen Summen).
      Verify: `bun run test` (Negativ-Tests)

- [x] T5: remove dead Pomodoro, reminder, and auto-break settings UI
      Files: src/pages/Settings.tsx, src/lib/types.ts, src/lib/db/settings.ts
      Change: Settings bewarb schaltbare Features „Pomodoro“ und „Erinnerungen“ plus „Auto-Pause nach Minuten“ — ohne jegliche Implementierung (Roadmap: out of scope). Toggles, beide Config-Cards und tote Typfelder entfernt; alte Keys in gespeicherten Settings sind harmlos.
      Verify: `bun run typecheck && bun run test && bun run build`

- [x] T6: delete dead EntryCard alias and unused dependencies
      Files: src/components/EntryCard.tsx (gelöscht), package.json, bun.lock
      Change: EntryCard war ein Re-Export ohne Importer; `workbox-window` und `@vitest/ui` wurden nie benutzt.
      Verify: `bun run build && bun run test`

- [x] T7: implement the "Timer starten" PWA shortcut
      Files: src/pages/Today.tsx
      Change: Das Manifest-Shortcut zeigte auf `/?action=start`, aber nichts las den Parameter. TodayPage konsumiert ihn jetzt: URL bereinigen, Timer starten falls keiner läuft.
      Verify: `bun run build`; manuell `/?action=start` öffnen

- [x] T8: add 404 catch-all route
      Files: src/lib/router.tsx, src/pages/NotFound.tsx (neu)
      Change: Unbekannte Pfade zeigten eine leere Seite in der Shell. Wildcard-Route mit Not-Found-Card und Link zur Übersicht ergänzt.
      Verify: `bun run build`; manuell `/nope` öffnen

- [x] T9: lint hygiene — clear all fixable warnings
      Files: src/pages/Settings.tsx, src/pages/EntryEdit.tsx, src/pages/Invoice.tsx, src/components/Onboarding/OnboardingSheet.tsx, src/components/ui/Combobox.tsx, src/components/ui/CommandPalette.tsx, src/lib/db/timeEntries.ts, src/lib/io/exportCsv.ts, src/main.tsx, biome.json
      Change: Non-Null-Assertions durch echte Narrowings ersetzt, Highlight-Reset-Effekte in Event-Handler verlegt, Optional Chains/Template Literals, Root-Element-Guard, `noNonNullAssertion` für Testdateien per Override aus. Übrig: nur die 5 bewussten `!important`-CSS-Warnungen.
      Verify: `bun run lint`

- [x] T10: sync docs to reality; move roadmap to docs/ROADMAP.md
      Files: PLAN.md → docs/ROADMAP.md, README.md, CHANGELOG.md, SETUP.md, .github/PULL_REQUEST_TEMPLATE.md, .github/ISSUE_TEMPLATE/feature_request.md
      Change: Roadmap-Drift behoben (DB v3 mit 5 Stores, `createBrowserRouter`, BroadcastChannel-Namen, Phase 7 mit Pausen/Wochenübersicht/Stundenkonto/Archiv/Feature-Flags), alle Links umgezogen, `compatibility_date` in SETUP.md an wrangler.toml angeglichen, dieses Dokument als Session-Protokoll angelegt.
      Verify: `grep -rn "PLAN.md" *.md .github/` → nur noch dieses Dokument

## Bewusst nicht gemacht (geprüft, keine Bugs)

- EntryEdit „inkonsistente endedAt/Dauer“: `endedAt` wird beim Speichern immer aus Start + Dauer abgeleitet — Rückwärts-Einträge sind unmöglich.
- Timer-Tick-Drift: der Effekt ist absichtlich auf die Entry-ID gekeyt.
- Onboarding-Skip: `patchSettings` ist synchrones localStorage, kein Fehlerpfad.
- `key={i}` in der Rechnungsvorschau, `!important` für reduced-motion/print: dokumentiert bewusst.

## Not this session

- Recovery-UI für bereits korrupte DBs mit zwei laufenden Einträgen (T3 verhindert neue Fälle).
- Live-Pausenzeit in Reports/Woche (laufende Einträge zählen designgemäß mit 0s).
- E2E-/Browser-Tests (vitest + jsdom ist für die App-Größe angemessen).
