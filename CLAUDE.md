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
bun run lint        # oxlint + oxfmt --check
bun run typecheck   # tsc (App + SW + Worker)
bun run test        # Vitest
bun run build       # SPA + PWA
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **oxlint + oxfmt** für Lint + Format. Geteilte Regeln in `oxlint.base.json`
  und `.oxfmtrc.json` (zentral verwaltet, `web-base update` überschreibt sie —
  nicht anfassen), App-Ausnahmen in `.oxlintrc.json` → `overrides`,
  Formatter-Ausnahmen in `.prettierignore`. Einzelne Stellen mit
  `// oxlint-disable-next-line <regel> -- <grund>` begründen.
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
- **Akzent ist `--accent-h: 255`** (Blau, seit web-base 0.6.0; vorher 230 —
  exakt der Hue von `--color-info`). Er steht in `src/lib/ui/theme.css`;
  `theme_color` / `<meta name="theme-color">` ist das passende `accent-600`
  (`#005cc2`). Die eigene `--color-brand-*`-Skala und die getönten Neutralen in
  `src/index.css` hängen per `var(--accent-h)` am selben Hue — keinen Hue dort
  fest eintragen. `src/lib/ui/tokens.css` gehört web-base und wird nie editiert.
- **`[build] command = "bun run build"` in `wrangler.toml`** wird von Cloudflare
  Workers Builds konsumiert. Nicht entfernen, auch wenn es nicht im Template steht.
- **Die CSP steht in `public/_headers`** und ist `script-src 'self'` — ohne
  Inline-Hash. Kein Inline-`<script>` in `index.html` einführen, sonst muss der
  Hash wieder gepflegt werden und bricht lautlos, sobald sich das Snippet
  ändert. Der Worker setzt keine eigene CSP mehr: Assets (inkl. `index.html` als
  SPA-Fallback) liefert Cloudflare aus, ohne den Worker aufzurufen — dort greift
  nur `_headers`. Worker-Antworten (`/api`, `/healthz`) bekommen `nosniff` und
  `no-store` aus dem owned `worker/base.ts`.
- **Updates warten auf den Nutzer.** Der Service Worker ist
  `registerAppShell()` aus dem owned `src/sw/base.ts` (`registerType:
  "prompt"`); `<UpdatePrompt />` in `src/main.tsx` bietet „Neu laden" an. Kein
  eigenes `skipWaiting()`, kein Auto-Reload — eine offene Seite verliert so
  beim Deploy nicht ihre Lazy-Chunks; fehlt doch einer, bietet `RouteError`
  „Neu laden" an.
- **Tests räumen in `src/test/app-setup.ts` auf** (Stores leeren,
  `localStorage` leeren). `src/test/setup.ts` gehört web-base — nichts
  App-Spezifisches hineinschreiben.

## Bewusste Abweichungen

- **`CODE_OF_CONDUCT.md`** existiert hier zusätzlich zum Hygiene-Set.
- Die App-Shell (`src/features/shell/AppShellContainer.tsx`) komponiert den
  web-base-`AppShell` mit eigenen `headerActions` (Live-Timer-Badge,
  Befehlsmenü). Theme-Umschalter, Offline-Hinweis und Skip-Link kommen aus
  web-base und werden von `AppShell` selbst gemountet.
- **Router-Form**: die Root-Layout-Route ist `src/App.tsx`, aber anders als im
  Template *ohne* `AppShell` — sie trägt nur Provider (Toast, Confirm) und
  globale Listener (Shortcuts, Onboarding). Die Shell ist eine verschachtelte
  Layout-Route darunter, weil `/willkommen` ohne Shell rendert. `RouteError`,
  `RouteFallback` und `*` → `NotFound` sind wie im Template verdrahtet.
