# Security Policy

## Unterstützte Versionen

Zeiterfassung wird kontinuierlich vom `main`-Branch ausgeliefert (Cloudflare Worker Deployment). Es gibt keine parallelen Release-Branches — Sicherheitsfixes landen direkt in `main` und werden zeitnah deployed.

## Scope

Diese App ist eine **client-seitige PWA**. Alle Daten leben in IndexedDB und `localStorage` im Browser des Nutzers. Der Cloudflare Worker (`worker/index.ts`) liefert ausschließlich Static Assets aus und stellt einen `/healthz`-Endpoint bereit — es gibt keine Authentifizierung, kein Backend, keine Server-Daten.

Relevante Themenfelder für Security-Reports:

- XSS, CSP-Umgehung, Service-Worker-Mißbrauch
- Datenexposition durch Bugs im Import/Export (JSON, CSV, PDF)
- Supply-Chain (z. B. kompromittierte Dependencies)
- Probleme mit dem Worker-Routing oder Headers

Nicht im Scope:

- Probleme, die nur durch physischen Zugriff auf das Gerät / den Browser-Profil möglich sind
- Browser-Bugs oder Bugs in externen Bibliotheken (bitte dort melden)
- Verluste von IndexedDB-Daten durch Browser-Löschung (kein Bug, sondern dokumentiertes Verhalten — Backup nutzen)

## Eine Schwachstelle melden

**Bitte keine Sicherheitslücken in öffentlichen Issues posten.**

Stattdessen per E-Mail an **security@daniel-rck.de** mit folgenden Angaben (soweit verfügbar):

- Beschreibung der Schwachstelle und potenzielle Auswirkung
- Schritte zur Reproduktion
- Betroffene URL / betroffener Code-Pfad
- Browser/Version, in dem reproduziert wurde
- (Optional) Vorschlag zur Behebung

## Was du erwarten kannst

- **Eingangsbestätigung** innerhalb von **7 Tagen**.
- **Erste Einschätzung** (akzeptiert / abgelehnt / weiterführende Fragen) innerhalb von **14 Tagen**.
- **Fix-Zeitrahmen**: kritische Issues priorisiert, üblicherweise innerhalb von 30 Tagen. Bei Bedarf koordinieren wir das Veröffentlichungsdatum.
- **Credit**: Wir nennen dich gerne in [CHANGELOG.md](./CHANGELOG.md) — auf Wunsch auch anonym.

Es gibt **kein Bug-Bounty-Programm**. Danke für dein Verständnis und dein Mitwirken an einer sichereren App.
