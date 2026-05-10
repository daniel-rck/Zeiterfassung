# Setup

Die App läuft komplett im Browser. Es gibt **kein Backend** — der Cloudflare Worker dient nur dazu, das gebaute SPA von Cloudflares Edge auszuliefern.

## Cloudflare Services

| Service | Zweck | Free-Tier |
|---|---|---|
| Workers | App-Bundle ausliefern | 100.000 Requests/Tag |
| Static Assets | Vite-Build (`dist/`) als Assets | inkludiert |

Keine KV, keine D1, kein R2, keine Bindings. Daten bleiben im Browser.

## 0. Voraussetzungen

- Cloudflare-Account (kostenlos)
- `bun` lokal installiert
- `wrangler` (per `bun run worker:dev` automatisch via devDependency)

## 1. Worker mit Git verbinden (empfohlen)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Connect to Git**.
2. Repository wählen: `daniel-rck/Zeiterfassung`.
3. Build-Konfiguration:
   - **Build command**: `bun run build`
   - **Deploy command**: `npx wrangler deploy`
   - **Branch**: `main`
4. Speichern. Cloudflare baut bei jedem Push auf `main` automatisch neu und veröffentlicht.

Die `wrangler.toml` enthält bereits:

```toml
name = "zeiterfassung"
main = "worker/index.ts"
compatibility_date = "2025-10-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
```

`not_found_handling = "single-page-application"` sorgt dafür, dass alle Routen (z. B. `/reports`) auf `index.html` fallen, sodass der React-Router sie übernehmen kann.

## 2. Manuelles Deployment (Alternative)

```bash
bun install
bun run build
bun run worker:deploy
```

Beim ersten `wrangler deploy` fragt Cloudflare nach Auth (`wrangler login`). Danach ist der Worker unter `zeiterfassung.<account>.workers.dev` erreichbar.

## 3. Verifikation

Nach dem Deploy:

- `https://<deine-url>/healthz` → `ok` (Plaintext)
- `https://<deine-url>/` → App lädt, Onboarding erscheint beim ersten Besuch
- DevTools → **Application → Service Workers**: SW registriert
- DevTools → **Application → IndexedDB**: DB `zeiterfassung` wird angelegt, sobald du den ersten Eintrag erstellst
- Lighthouse PWA-Audit ≥ 95

## Troubleshooting

**Routen geben 404 nach Reload.** Prüfe, dass `not_found_handling = "single-page-application"` in `wrangler.toml` steht. Beim ersten Deploy nach Änderung kann es 1–2 Minuten dauern, bis die Edge-Cache invalidiert ist.

**Service Worker aktualisiert nicht.** `vite-plugin-pwa` läuft mit `registerType: 'autoUpdate'`. Wenn der SW hängt: DevTools → Application → Service Workers → **Unregister** → Hard-Reload. In Production updated der SW beim nächsten Tab-Refresh nach Deploy.

**Daten weg nach Browser-Wechsel.** IndexedDB ist pro Browser-Profil. Für Geräte-Umzug: **Einstellungen → Backup herunterladen** auf altem Gerät, dann **Backup importieren** auf neuem.

**Storage Quota erreicht.** IndexedDB hat in modernen Browsern üblicherweise mehrere GB Quota — bei normaler Nutzung kein Problem. Bei Quota-Warnung exportiere und lösche alte Einträge.

## Free-Tier-Verbrauch

| Aktion | Verbrauch |
|---|---|
| Seitenaufruf | 1 Worker-Request + ggf. 1 Asset-Request pro Datei (gecacht im SW nach erstem Besuch) |
| API-Calls | 0 — die App spricht nicht mit dem Worker |
| Storage | 0 — alles im Browser |

Bei einem Solo-User mit wenigen Tab-Reloads pro Tag liegt der Verbrauch deutlich unter 1 % der Free-Tier-Grenze.
