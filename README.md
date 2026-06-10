<div align="center">
  <img src="./public/logo.svg" alt="Zeiterfassung" width="96" height="96" />

# Zeiterfassung

Eine schlanke, lokale Browser-PWA für Zeiterfassung. Timer starten, Projekten zuordnen, Reports und Rechnungen erstellen — ohne Account, alles im Browser.

[![CI](https://github.com/daniel-rck/Zeiterfassung/actions/workflows/ci.yml/badge.svg)](https://github.com/daniel-rck/Zeiterfassung/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8.svg)](https://web.dev/progressive-web-apps/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 7](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind 4](https://img.shields.io/badge/Tailwind-4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-1.x-FBF0DF.svg?logo=bun&logoColor=black)](https://bun.sh/)

</div>

---

## Für Nutzer

- **Lokal, ohne Account** — Daten liegen in IndexedDB im Browser, keine Cloud, kein Tracking.
- **Vier Detail-Stufen** — Basis (nur Timer) bis Pro+ (Rechnungen mit PDF), jederzeit umschaltbar.
- **PWA** — installierbar, offline-fähig, Dark Mode, Tastatur-Shortcuts.
- **Backup als JSON** — exportieren, auf anderem Gerät importieren.

→ App ansehen: **[/willkommen](https://zeiterfassung.daniel-rck.workers.dev/willkommen)** · Direkt loslegen: **[zeiterfassung.daniel-rck.workers.dev](https://zeiterfassung.daniel-rck.workers.dev)**

## Für Entwickler

### Tech-Stack

| Bereich | Wahl |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| PWA | `vite-plugin-pwa` (`injectManifest`) |
| Storage | IndexedDB via `idb` + `localStorage` |
| Tests | Vitest + Testing Library |
| Lint/Format | Biome |
| Hosting | Cloudflare Workers + Static Assets |
| Package Manager | Bun |

> Aufgebaut auf der [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)-Foundation. Architektur und sanktionierte Abweichungen: [`docs/specs/`](./docs/specs/00-overview.md).

### Quickstart

```bash
bun install
bun run dev          # http://localhost:5173
```

### Befehle

```bash
bun run build        # Production Build nach dist/
bun run preview      # gebauten Stand lokal ausliefern
bun run test         # Vitest einmalig
bun run test:watch   # Vitest watch mode
bun run lint         # Biome (check)
bun run format       # Biome (format --write)
bun run typecheck    # tsc -b --noEmit
bun run worker:dev   # lokaler Cloudflare Worker
bun run worker:deploy
```

### Architektur in 30 Sekunden

- **Keine Backend-Logik.** Der Worker (`worker/index.ts`) liefert nur Static Assets aus und hält einen `/healthz`-Endpoint bereit.
- **Storage**: IndexedDB (`src/lib/db/`) für Domain-Daten, `localStorage` für Settings. Reaktiv über `useLiveQuery` + `notifyMutation` (Multi-Tab-Sync via `BroadcastChannel`).
- **Features per Detail-Stufe**: `useDetailLevel()` + `<Gated level="pro">` (`src/components/Gated.tsx`) blenden Felder dynamisch ein/aus, ohne Daten zu verlieren.
- **Routing**: `react-router-dom` v7 (`createBrowserRouter`) in `src/lib/router.tsx`. Layout über die kanonische `src/lib/ui/AppShell`, verdrahtet in `src/features/shell/`, Pages in `src/pages/`.

Mehr Kontext: [docs/ROADMAP.md](./docs/ROADMAP.md) (Roadmap, Datenmodell, Out-of-Scope) · [SETUP.md](./SETUP.md) (Cloudflare-Deployment).

## Beitragen

Pull Requests sind willkommen. Vor dem ersten PR bitte [CONTRIBUTING.md](./CONTRIBUTING.md) lesen — dort stehen Branch-Konventionen, lokales Setup und was vor dem Push grün sein muss.

Bug oder Idee? → [Issue eröffnen](https://github.com/daniel-rck/Zeiterfassung/issues/new/choose). Sicherheitslücke? → [SECURITY.md](./SECURITY.md).

## Lizenz

[MIT](./LICENSE) · © Daniel Rück
