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
   (incl. a sha256 hash over the inline theme-bootstrap script in
   `index.html`), HSTS, X-Frame-Options, Referrer/Permissions-Policy and
   nosniff on every response, on top of the canonical worker skeleton.
2. **Service-worker navigation fallback** — `src/sw/index.ts` adds a
   `NavigationRoute` → `/index.html` handler so offline deep links keep working.
3. **App-side theme toggle** — the canonical `theme.css` drives dark mode via
   `prefers-color-scheme`; the app keeps an explicit light/dark/system toggle
   (settings-persisted, pre-paint bootstrap in `index.html`). `src/index.css`
   bridges the canonical `surface`/`fg`/`border` tokens to the `.dark` class so
   the lib/ui shell follows the explicit choice.
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
