# Beitragen zu Zeiterfassung

Schön, dass du beitragen willst! Dieses Dokument fasst zusammen, wie wir hier arbeiten — kurz und pragmatisch.

## Vor dem ersten Beitrag

1. Schau in [PLAN.md](./PLAN.md). Dort steht die lebende Roadmap mit den Phasen 0–6 (alle ✅) und der Liste der **Out-of-Scope**-Themen. Ideen, die explizit Out-of-Scope sind (kein Cloud-Sync, keine Team-Features, keine native App), werden in der Regel nicht angenommen.
2. Lies den [Code of Conduct](./CODE_OF_CONDUCT.md).
3. Bei größeren Änderungen lohnt sich ein Issue **vor** dem Code, damit wir Scope und Ansatz vorab klären können.

## Lokales Setup

Voraussetzungen: [Bun](https://bun.sh/) (aktuelle Version).

```bash
git clone https://github.com/daniel-rck/Zeiterfassung.git
cd Zeiterfassung
bun install
bun run dev
```

Damit läuft die App auf `http://localhost:5173`.

## Branch- und Commit-Konventionen

- **Branches**: `feature/<kurzbeschreibung>`, `fix/<kurzbeschreibung>`, `docs/<kurzbeschreibung>`, `refactor/<kurzbeschreibung>`.
- **Commits**: Imperativ und auf Deutsch oder Englisch, kurz und beschreibend. Beispiel: `fix: Timer stoppt nicht nach Mitternacht` oder `feat: CSV-Export für Reports`. Conventional Commits sind nicht zwingend, aber gerne gesehen.
- **Eine logische Änderung pro PR.** Lieber zwei kleine PRs als ein großer.

## Was vor dem Push grün sein muss

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Genau diese vier Schritte laufen auch in CI (siehe `.github/workflows/ci.yml`). Wenn die lokal grün sind, sollte auch CI grün sein.

## Tests

- Logik-Tests gehören neben den Quelldateien in `__tests__/`-Ordner (siehe z. B. `src/lib/__tests__/`).
- Für DB-bezogene Tests gibt es das Setup in `src/test/setup.ts` mit `fake-indexeddb` — kein Mocken nötig.
- Neue Komponenten mit nicht-trivialem Verhalten brauchen einen Smoke-Test mit Testing Library.

## PR-Checkliste

Wenn du den PR öffnest, hilft uns Folgendes (das PR-Template fragt das auch ab):

- [ ] CI ist grün (Lint, Typecheck, Test, Build).
- [ ] Wenn UI geändert wurde: Screenshots im PR.
- [ ] Wenn ein neues Feature: kurz in [PLAN.md](./PLAN.md) erwähnt oder in [CHANGELOG.md](./CHANGELOG.md) unter `## [Unreleased]` eingetragen.
- [ ] Keine Cloud-/Server-Abhängigkeiten eingeführt — die App bleibt **client-only**.

## Code-Stil

- ESLint und TypeScript sind die Wahrheit. Lokale Regeln per Inline-Disable nur mit Kommentar, warum.
- Keine neuen `any`-Stellen.
- Tailwind-Klassen direkt im JSX, keine eigenen CSS-Dateien (außer `src/index.css` für globale Tokens).
- Komponenten in `src/components/ui/` sind die Bausteine — bitte wiederverwenden statt neu erfinden.
- Imports aufgeräumt (ESLint sortiert das nicht automatisch, aber bitte gruppieren: extern → intern → relativ).

## Fragen?

→ [Issue eröffnen](https://github.com/daniel-rck/Zeiterfassung/issues/new/choose) mit Label `question`.
