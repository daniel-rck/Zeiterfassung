# Architecture overview

Zeiterfassung is built on the [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)
canonical foundation. This directory documents the app's architecture and the
sanctioned deviations from the web-base baseline. Specs are the source of
truth — when a design decision changes, update the matching spec in the same
PR.

## web-base adoption

The app is stamped `webBase.version: 0.6.0` and adopts the full web-base
`core` foundation (`web-base check --strict` and `web-base pins` are clean and
run in CI):

- **Tooling** — oxlint + oxfmt (`oxc` template: `oxlint.base.json`,
  `.oxfmtrc.json`, per-app `.oxlintrc.json`), `.editorconfig`, hygiene files, the
  reusable CI workflows (`web-app-ci.yml` and `web-base-check.yml` with
  `strict` + `pins`, both pinned `@v0.6.0` and bumped by Dependabot), package
  metadata + `packageManager: bun@1.3.11`, strict TS with
  `noUncheckedIndexedAccess`.
- **Testing** — `vitest.config.ts` merges `vite.config.ts`; the owned
  `src/test/setup.ts` (fake-indexeddb, jest-dom, cleanup, `matchMedia` stub) runs
  first, then the app's `src/test/app-setup.ts` (empties every store and
  `localStorage` after each test).
- **Router** — `createBrowserRouter` data router in `src/lib/router.tsx` with
  typed `ROUTES` constants in `src/lib/routes.ts`. The root layout route is
  `src/App.tsx` with `ErrorBoundary: RouteError` and `HydrateFallback:
  RouteFallback`; pages render inside a nested `AppShellContainer` layout route
  whose pathless child carries a second `RouteError` (a page error keeps the
  shell), and `*` renders the owned `NotFound`. Every page sets its tab title
  with `useDocumentTitle`.
- **Storage** — `src/lib/db/db.ts` is the seam: `getDB = createDBOpener(…)`
  (owned `open.ts`) with the app's schema, the existing database name
  `zeiterfassung` and version 3, and an `if (oldVersion < N)` ladder. Live
  queries use the owned `useLiveQuery.ts`; writes call `notifyMutation` (owned
  `mutations.ts`). A newer schema opened in another tab closes this tab's
  connection and reloads it.
- **PWA** — injectManifest service worker: `src/sw/index.ts` only calls
  `registerAppShell()` from the owned `src/sw/base.ts` (precache, `index.html`
  for every navigation except `/api` and `/healthz`, activation on
  `SKIP_WAITING` only). `registerType: "prompt"`; `<UpdatePrompt />` in
  `src/main.tsx` offers the reload.
- **Worker** — `worker/index.ts` delegates to `routeRequest` (owned
  `worker/base.ts`); `handleApi` has no endpoints yet. `wrangler.toml` serves
  the SPA with `not_found_handling = "single-page-application"` and no
  `run_worker_first`.
- **Layout** — canonical UI in `src/lib/ui/` (owned files byte-identical,
  updated via the web-base CLI), consumed through
  `src/features/shell/AppShellContainer.tsx`. `theme.css` is the seam: it
  imports the owned `tokens.css` and sets `--accent-h: 255` (Blau; was 230,
  the `info` hue, before 0.6.0). `theme_color` is `#005cc2` (accent-600).

## Sanctioned deviations

These intentionally diverge from the bare web-base templates (allowed for
app-specific handlers):

1. **Root layout without the shell** — `src/App.tsx` holds the app-wide
   providers (`ToastProvider`, `ConfirmProvider`) and listeners
   (`GlobalShortcuts`, `Onboarding`), not `AppShell`: the welcome page
   (`/willkommen`) renders without the shell, so the shell is a nested layout
   route.
2. **Security headers** — `public/_headers` keeps the template policy as is
   (`script-src 'self'` with no inline hash — `index.html` carries no inline
   script; `style-src 'self'`, since React `style` props go through the CSSOM).
   It replaced the CSP the worker used to set on its own responses, which never
   reached `index.html` or the bundles: Workers Assets serves those without
   invoking the worker.
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
   `src/lib/ui` tokens/primitives used by the shell. The app tokens live in
   `src/index.css` and take their hue from `var(--accent-h)`, so the brand scale
   follows the accent slot. Primary and danger buttons use the 600 shades so
   `text-fg-on-accent` on them clears WCAG AA.
6. **Intentional lint suppressions** — the stricter oxlint React rules
   (`set-state-in-effect`, `purity`) flag a few deliberate patterns (1 s timer
   ticks, reset-on-open, "today" re-read per render). Each is suppressed inline
   with `oxlint-disable-next-line <rule> -- <reason>`, never globally.

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
