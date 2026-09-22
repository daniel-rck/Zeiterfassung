# Architecture overview

Zeiterfassung is built on the [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)
canonical foundation. This directory documents the app's architecture and the
sanctioned deviations from the web-base baseline. Specs are the source of
truth — when a design decision changes, update the matching spec in the same
PR.

## web-base adoption

The app adopts the web-base `core` foundation:

- **Tooling** — Biome (`biome.json`), `.editorconfig`, hygiene files, the
  reusable CI workflow (`.github/workflows/web-app-ci.yml@main`), package
  metadata + `packageManager: bun@1.3.11`, strict TS with
  `noUncheckedIndexedAccess`.
- **Router** — `createBrowserRouter` data router in `src/lib/router.tsx` with
  typed `ROUTES` constants in `src/lib/routes.ts`.
- **Storage** — idb wrapper + reactive `useLiveQuery` in `src/lib/db/`
  (`db.ts` schema, `useLiveQuery.ts`, `index.ts` barrel). Mutations notify per
  store via `notifyMutation`.
- **PWA** — injectManifest service worker at `src/sw/index.ts`.
- **Worker** — Cloudflare Worker at `worker/index.ts`.
- **Layout** — canonical UI in `src/lib/ui/` (kept byte-identical, updated via
  the web-base CLI), consumed through `src/features/shell/AppShellContainer.tsx`.
  App accent hue: `--accent-h: 230`.

Files under `src/lib/` are meant to stay identical across web-base apps as a
drift-detection signal; `useLiveQuery.ts` and `src/lib/ui/*` are byte-identical
to the template.

## Sanctioned deviations

These intentionally diverge from the bare web-base templates (allowed for
app-specific handlers):

1. **Worker security headers** — `worker/index.ts` re-applies a strict CSP
   (`script-src 'self'`, no inline hash — `index.html` carries no inline
   script), HSTS, X-Frame-Options, Referrer/Permissions-Policy and nosniff on
   every response, on top of the canonical worker skeleton.
2. **Service-worker navigation fallback** — `src/sw/index.ts` adds a
   `NavigationRoute` → `/index.html` handler so offline deep links keep working.
   The SW activates immediately (`skipWaiting` on install, `registerType:
   autoUpdate`), which drops the previous build's hashed chunks; `src/main.tsx`
   therefore reloads once on `vite:preloadError` so an open tab picks up the
   new build instead of failing its next lazy route.
3. **Theme migration shim** — the theme follows the web-base contract
   (`localStorage["theme"]`, expressed as `data-theme` on `<html>`, toggle from
   `lib/ui`). `public/theme-init.js` additionally migrates the theme once from
   the app's old settings blob; keep it while users with old state exist
   (covered by `src/lib/__tests__/themeInit.test.ts`). App dark overrides in
   `src/index.css` use `@variant dark`, never a `.dark` class.
4. **Custom 5-store schema** — `src/lib/db/db.ts` defines the app's
   `projects`/`tags`/`time_entries`/`invoices`/`breaks` schema (DB version 3).
   The schema is app-specific; the surrounding storage utilities are canonical.
5. **Retained app design system** — the app keeps its own Tailwind token set
   (`--color-brand-*`, `--color-surface-0..3`, `--color-text-*`, …) and
   `src/components/ui/*` primitives for app screens, alongside the canonical
   `src/lib/ui` tokens/primitives used by the shell. Both token sets coexist in
   `src/index.css`.
6. **Biome excludes `src/lib/ui`** — the vendored canonical UI is kept
   byte-identical and updated via the CLI, so it is excluded from Biome
   (mirroring how web-base excludes its own `cli/templates`).

## Domain rules

- **Entries belong to the range they start in.** `listEntries` keeps a
  finished entry only if `startedAt` lies in `[from, to]`, matching
  `groupByDay`'s `dayKey(startedAt)`. An entry spanning midnight or a week
  boundary is therefore counted once. A running entry stays visible in every
  range it overlaps (its `durationSec` is 0 until stopped).
- **`durationSec` is net of breaks.** `stopTimer` and `updateEntry` (when
  start/end change) subtract finished breaks; the live timer shows the same
  net value. Edits that don't touch start/end keep the stored duration.
- **Entry writes are read-merge-write in one transaction.** A patch without an
  explicit `endedAt` key never changes the end, so a stale edit cannot resume a
  stopped timer. Changing `projectId` re-snapshots rate and currency.
- **CSV export** uses the German Excel dialect: `;` separator, decimal comma,
  UTF-8 BOM, formula-injection prefix.
