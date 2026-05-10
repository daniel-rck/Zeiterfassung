# Zeiterfassung

Eine schlanke, lokale Browser-PWA für Zeiterfassung. Timer starten, Projekten zuordnen, Reports und Rechnungen erstellen — ohne Account, alles im Browser.

## Was ist das?

Ein persönliches Zeiterfassungs-Tool für den Browser. Daten liegen in IndexedDB (lokal im Browser), keine Server-Anbindung, kein Tracking. Beim ersten Start wählst du, **wie tief** du erfassen willst — Basis (nur Timer), Standard (+ Projekte), Pro (+ Tags & Stundensätze) oder Pro+ (+ Rechnungs-Vorschau & PDF-Export). Du kannst die Stufe jederzeit ändern, ohne Daten zu verlieren.

## Funktionen

- **Timer** mit Beschreibung, Live-Anzeige, Multi-Tab-Sync
- **Manuelle Einträge** mit flexibler Dauer-Eingabe (`1h 30m`, `1.5`, `90m`, `01:30`)
- **Projekte** mit Farbe, Kunde, Stundensatz und Standard-Abrechenbarkeit
- **Tags** mit Farbe für freie Klassifikation
- **Reports** nach Tag/Woche/Monat/Custom — gefiltert nach Projekt, Tag, Abrechenbarkeit
- **CSV-Export** der gefilterten Einträge
- **Rechnungen** als druck- und PDF-fähige Vorschau, mit Steuersatz und fortlaufender Nummer
- **Backup** als JSON-Datei, Import auf anderem Gerät
- **Tastatur-Shortcuts** (Leertaste = Start/Stop, `N` = Neu, `R` = Reports …)
- **PWA** — installierbar, offline-fähig, eigene Icons
- **Dark Mode** + System-Theme

## Deine Daten gehören dir

Alle Daten bleiben in deinem Browser (IndexedDB + localStorage). Es gibt **keine Cloud-Anbindung**, keinen Account und kein Tracking. Für Backup oder Geräte-Umzug nutze die JSON-Export/Import-Funktion in den Einstellungen. Beim Löschen der Browser-Daten gehen die Einträge verloren — also regelmäßig exportieren!

## Lokal entwickeln

```bash
bun install
bun run dev          # Vite Dev Server auf http://localhost:5173
bun run build        # Production Build nach dist/
bun run preview      # gebauten Stand lokal ausliefern
bun run test         # Vitest einmalig
bun run test:watch   # Vitest watch mode
bun run lint         # ESLint
bun run typecheck    # tsc -b --noEmit
```

## Cloudflare Worker

```bash
bun run build           # erst dist/ erzeugen
bun run worker:dev      # wrangler dev — lokaler Worker mit Static Assets
bun run worker:deploy   # Deployment
```

Details zum Cloudflare-Setup in [SETUP.md](./SETUP.md). Der Worker ist bewusst minimal — er liefert nur die Static Assets aus und stellt einen Health-Check bereit. Es gibt keine Backend-Logik.

## Tech-Stack

| Bereich | Wahl |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| PWA | `vite-plugin-pwa` (`injectManifest`, eigener Service Worker) |
| Storage | IndexedDB via `idb` + `localStorage` für Settings |
| Tests | Vitest + Testing Library |
| Hosting | Cloudflare Workers + Static Assets |
| Package Manager | Bun |

## Roadmap

Siehe [PLAN.md](./PLAN.md) für das vollständige Roadmap-Dokument mit Phasen 0–6 und Out-of-Scope-Liste.

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
