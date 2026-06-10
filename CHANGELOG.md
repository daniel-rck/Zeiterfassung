# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) · Versionsschema: [SemVer](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefügt

- Landing-Page unter `/willkommen` für erstmalige Besucher (Hero, Feature-Grid, Detail-Stufen-Übersicht, Privacy-Block).
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` und `CHANGELOG.md`.
- Issue- und Pull-Request-Templates unter `.github/`.
- Badges (CI-Status, Lizenz, Tech-Stack, PWA, Cloudflare) im README.

### Geändert

- README neu strukturiert: klare Trennung zwischen User-Pitch und Entwickler-Setup, kompakter.

## [0.1.0] — 2026-05-18

Erstveröffentlichung. Alle Roadmap-Phasen 0–6 abgeschlossen (siehe [docs/ROADMAP.md](./docs/ROADMAP.md)).

### Hinzugefügt

- **Phase 0 — Setup**: Vite 7 + React 19 + TypeScript + Tailwind 4, PWA via `vite-plugin-pwa` (`injectManifest`), Vitest, Cloudflare-Worker-Hosting, GitHub-Actions-CI.
- **Phase 1 — DB & Hooks**: IndexedDB-Schema (`projects`, `tags`, `time_entries`), CRUD-Module, `BroadcastChannel`-Multi-Tab-Sync, Hooks (`useProjects`, `useTags`, `useEntries`, `useRunningEntry`, `useSettings`, `useDetailLevel`, `useTheme`).
- **Phase 1.5 — Onboarding & Detail-Stufen**: 4-Stufen-Modell (Basis · Standard · Pro · Pro+), 4-Schritte-Onboarding-Sheet, `<Gated>`-Komponente, Stufenwechsel jederzeit ohne Datenverlust.
- **Phase 2 — Timer & Einträge**: Timer mit Live-Tick und Multi-Tab-Sync, manuelle Einträge mit Multi-Format-Dauer-Parser (`1h 30m`, `1.5`, `90m`, `01:30`).
- **Phase 3 — Projekte & Tags**: CRUD mit Soft-Delete (Archive), Quick-Create in den Pickern.
- **Phase 4 — Reports**: Aggregation nach Tag/Woche/Monat/Custom, gefiltert nach Projekt/Tag/Abrechenbarkeit, SVG-Bars, CSV-Export.
- **Phase 5 — Rechnung & PDF**: Rechnungs-Vorschau mit Print-CSS und jspdf-PDF-Export, fortlaufende Rechnungsnummern, Rechnungs-Profil in Settings.
- **Phase 6 — Polish**: Tastatur-Shortcuts (Space, N, R), A11y-Touch-Targets ≥ 44px, `prefers-reduced-motion`, Skip-Link, Backup-Reminder mit letztem Backup-Datum.

[Unreleased]: https://github.com/daniel-rck/Zeiterfassung/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/daniel-rck/Zeiterfassung/releases/tag/v0.1.0
