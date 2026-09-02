# Claude-Code-Hinweise für Zeiterfassung

Schlanke, lokale Browser-PWA für Zeiterfassung — Timer, Projekte, Tags, Reports
und Rechnungen, ohne Account, alles im Browser.

## Quelle der Wahrheit

1. **`docs/specs/00-overview.md`** — die App-Spec. Vor jeder Arbeit lesen; bei
   Designänderungen im selben Change aktualisieren (living document).
2. **Foundation [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)**
   — Stack, Layout-System, Storage-/PWA-/Router-/CI-Konventionen. Bei
   ungeklärten Entscheidungen die minimale, zu den bestehenden Mustern passende
   Variante wählen. Scaffolding & Updates über die CLI
   (`bunx github:daniel-rck/web-base …`), nicht von Hand kopieren.

## Quality Gates

Vor jedem Commit grün halten:

```bash
bun run lint        # Biome (check)
bun run typecheck   # tsc (App + SW + Worker)
bun run test        # Vitest
bun run build       # SPA + PWA
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **Biome** für Lint + Format. Geteilte Regeln in `biome.base.json` (zentral
  verwaltet, nicht anfassen), App-Ausnahmen in `biome.json` → `overrides`.
- **TypeScript 7 strict** inkl. `noUncheckedIndexedAccess`;
  `verbatimModuleSyntax` (→ `import type`); `type` statt `interface`.
- **Deutsche UI + README, englischer Quellcode** (Bezeichner, Kommentare,
  Commits, `docs/specs/`).
- **App-Daten in IndexedDB** (`src/lib/db/`), `localStorage` nur für Settings.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## App-spezifische Leitplanken

- **`src/lib/at.ts` statt `!` bei Index-Zugriffen.** Behält eine echte
  Laufzeitprüfung, wo `noUncheckedIndexedAccess` den Beweis nicht sieht
  (Schleifen mit Längen-Check, nicht-leere Literale). In Tests ist `!` erlaubt —
  dort soll ein Index außerhalb des Bereichs den Test laut scheitern lassen.
- **Das Theme liegt unter `localStorage["theme"]`**, nicht mehr im
  Settings-Blob, und wird über `data-theme` auf `<html>` ausgedrückt — nicht
  über eine `.dark`-Klasse. Grund: eine Klasse kann „folge dem OS" ohne
  JavaScript nicht ausdrücken, also flackerte jede erzwungene Wahl bis React
  gemountet war. `src/lib/hooks/useTheme.tsx` ist nur noch ein dünner Wrapper
  über `src/lib/ui/useTheme.ts`.
- **`public/theme-init.js` migriert einmalig** aus dem alten Settings-Blob.
  Nicht entfernen, solange Nutzer mit altem State existieren — abgesichert durch
  `src/lib/__tests__/themeInit.test.ts`.
- **Eigene Dark-Overrides mit `@variant dark`** schreiben (siehe `src/index.css`),
  nie mit `.dark` oder einem `@theme` innerhalb `@media` — Tailwind 4 hoistet
  `@theme` aus der Media-Query heraus, die Tokens gelten dann unbedingt.
- **Akzent ist `--accent-h: 230`.** Achtung: das ist exakt der Hue von
  `--color-info`; die eigene `--color-brand-*`-Skala trägt die sichtbare
  Identität. Als Follow-up in web-bases `04-layout-system.md` notiert.
- **`[build] command = "bun run build"` in `wrangler.toml`** wird von Cloudflare
  Workers Builds konsumiert. Nicht entfernen, auch wenn es nicht im Template steht.
- **Die CSP im Worker ist `script-src 'self'`** — ohne Inline-Hash. Kein
  Inline-`<script>` in `index.html` einführen, sonst muss der Hash wieder
  gepflegt werden und bricht lautlos, sobald sich das Snippet ändert.

## Bewusste Abweichungen

- **`CODE_OF_CONDUCT.md`** existiert hier zusätzlich zum Hygiene-Set.
- Die App-Shell (`src/features/shell/AppShellContainer.tsx`) komponiert den
  web-base-`AppShell` mit eigenen `headerActions` (Live-Timer-Badge,
  Befehlsmenü). Der Theme-Umschalter kommt aus web-base und wird von `AppShell`
  selbst gemountet.
