import { Link } from 'react-router-dom'
import {
  Clock,
  FolderKanban,
  Tags as TagsIcon,
  BarChart3,
  FileText,
  Smartphone,
  ShieldCheck,
  Github,
  ArrowRight,
  Download,
  Keyboard,
} from 'lucide-react'
import { Button } from '../components/ui/Button'

const FEATURES = [
  {
    icon: Clock,
    title: 'Timer & Einträge',
    body: 'Live-Timer mit Multi-Tab-Sync, manuelle Einträge mit flexiblem Dauer-Format (1h 30m, 1.5, 90m, 01:30).',
  },
  {
    icon: FolderKanban,
    title: 'Projekte',
    body: 'Mit Farbe, Kunde, Stundensatz und Standard-Abrechenbarkeit — Quick-Create direkt im Timer.',
  },
  {
    icon: TagsIcon,
    title: 'Tags',
    body: 'Freie Klassifikation mit Farbe für orthogonale Auswertung neben Projekten.',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    body: 'Tag, Woche, Monat oder Custom — gefiltert nach Projekt, Tag, Abrechenbarkeit. CSV-Export inklusive.',
  },
  {
    icon: FileText,
    title: 'Rechnungen',
    body: 'Druck- und PDF-fähige Vorschau, Steuersatz, fortlaufende Rechnungsnummer, Rechnungs-Archiv.',
  },
  {
    icon: Smartphone,
    title: 'PWA & Offline',
    body: 'Installierbar auf Desktop und Mobile. Funktioniert offline, eigene Icons, Dark Mode, Tastatur-Shortcuts.',
  },
]

const LEVELS = [
  {
    name: 'Basis',
    summary: 'Nur Timer',
    points: ['Timer + Beschreibung', 'Tagesliste', 'JSON-Backup'],
  },
  {
    name: 'Standard',
    summary: '+ Projekte',
    points: ['Projekte mit Farbe', 'Reports', 'CSV-Export'],
  },
  {
    name: 'Pro',
    summary: '+ Tags & Sätze',
    points: ['Tags', 'Stundensätze', 'Abrechenbarkeit', 'Rundung'],
  },
  {
    name: 'Pro+',
    summary: '+ Rechnungen',
    points: ['Rechnungs-Vorschau', 'PDF-Export', 'Rechnungs-Profil'],
  },
]

export function WelcomePage() {
  return (
    <div className="min-h-screen w-full bg-[color:var(--color-surface-0)] text-[color:var(--color-text-1)]">
      {/* Top nav */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt=""
            width={28}
            height={28}
            className="select-none"
          />
          <span className="text-sm font-semibold tracking-tight">
            Zeiterfassung
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <a
            href="https://github.com/daniel-rck/Zeiterfassung"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-[color:var(--color-text-2)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)]"
          >
            <Github size={14} />
            GitHub
          </a>
          <Button
            as={Link}
            to="/"
            variant="primary"
            size="sm"
            icon={<ArrowRight size={14} />}
            iconPosition="right"
          >
            Zur App
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] px-3 py-1 text-xs text-[color:var(--color-text-2)]">
            <ShieldCheck size={12} className="text-[color:var(--color-success-500)]" />
            Lokal im Browser · Kein Account · Open Source
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Zeit erfassen,
            <br />
            <span className="text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
              ohne dass jemand mitliest.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-[color:var(--color-text-2)] sm:text-lg">
            Eine schlanke Browser-PWA für Freelancer und Solo-Worker. Timer starten,
            Projekten zuordnen, Reports und Rechnungen erstellen — alle Daten bleiben
            in deinem Browser.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              as={Link}
              to="/"
              variant="primary"
              size="lg"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Jetzt loslegen
            </Button>
            <Button
              as="a"
              href="https://github.com/daniel-rck/Zeiterfassung"
              target="_blank"
              rel="noreferrer noopener"
              variant="outline"
              size="lg"
              icon={<Github size={16} />}
            >
              Auf GitHub ansehen
            </Button>
          </div>
          <p className="mt-4 text-xs text-[color:var(--color-text-3)]">
            Keine Anmeldung. Funktioniert sofort.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Alles drin, was du brauchst
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--color-text-2)]">
            Vom puren Stoppen bis zur PDF-Rechnung — und kein bisschen mehr.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-5"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-600)] dark:bg-[color:var(--color-brand-950)] dark:text-[color:var(--color-brand-300)]">
                <f.icon size={18} />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[color:var(--color-text-2)]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Detail-Stufen */}
      <section className="border-y border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Vier Detail-Stufen
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--color-text-2)]">
              Du wählst im Onboarding, wie tief du erfassen willst. Stufe jederzeit
              wechselbar — Daten bleiben erhalten.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((lvl, i) => (
              <div
                key={lvl.name}
                className="flex flex-col rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-0)] p-5"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-[color:var(--color-text-3)]">
                    Stufe {i + 1}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{lvl.name}</h3>
                <p className="text-xs text-[color:var(--color-text-2)]">
                  {lvl.summary}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-[color:var(--color-text-2)]">
                  {lvl.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[color:var(--color-brand-500)]"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
              <ShieldCheck size={12} />
              Privatsphäre
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Deine Daten gehören dir.
            </h2>
            <p className="mt-4 text-sm text-[color:var(--color-text-2)] sm:text-base">
              Alles bleibt in deinem Browser — IndexedDB und localStorage. Keine
              Cloud, kein Account, kein Tracking, keine Cookies. Der Server liefert
              nur die App-Dateien aus, sonst nichts.
            </p>
            <p className="mt-3 text-sm text-[color:var(--color-text-2)] sm:text-base">
              Für Geräte-Umzug oder Sicherung gibt es JSON-Backup. Beim Löschen der
              Browser-Daten gehen die Einträge verloren — also regelmäßig
              exportieren.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
              <Download size={18} className="mt-0.5 text-[color:var(--color-brand-500)]" />
              <div>
                <h4 className="text-sm font-semibold">JSON-Backup</h4>
                <p className="text-xs text-[color:var(--color-text-2)]">
                  Ein Klick — alles im File. Auf anderem Gerät importieren.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
              <Keyboard size={18} className="mt-0.5 text-[color:var(--color-brand-500)]" />
              <div>
                <h4 className="text-sm font-semibold">Tastatur first</h4>
                <p className="text-xs text-[color:var(--color-text-2)]">
                  Leertaste = Start/Stop, N = Neuer Eintrag, R = Reports, ⌘K =
                  Befehle.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] p-4">
              <Smartphone size={18} className="mt-0.5 text-[color:var(--color-brand-500)]" />
              <div>
                <h4 className="text-sm font-semibold">Multi-Tab & Offline</h4>
                <p className="text-xs text-[color:var(--color-text-2)]">
                  Alle Tabs synchron via BroadcastChannel. Funktioniert auch ohne
                  Netz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)]">
        <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Bereit?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[color:var(--color-text-2)] sm:text-base">
            Onboarding dauert 30 Sekunden. Stufe lässt sich später jederzeit
            ändern.
          </p>
          <div className="mt-8">
            <Button
              as={Link}
              to="/"
              variant="primary"
              size="lg"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Jetzt loslegen
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[color:var(--color-border-subtle)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-[color:var(--color-text-3)] sm:flex-row sm:px-6">
          <div>
            <a
              href="https://github.com/daniel-rck/Zeiterfassung/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[color:var(--color-text-2)] hover:underline"
            >
              MIT-Lizenz
            </a>
            {' · '}
            <span>© Daniel Rück</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/daniel-rck/Zeiterfassung"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 hover:text-[color:var(--color-text-2)] hover:underline"
            >
              <Github size={12} />
              GitHub
            </a>
            <a
              href="https://github.com/daniel-rck/Zeiterfassung/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[color:var(--color-text-2)] hover:underline"
            >
              Beitragen
            </a>
            <a
              href="https://github.com/daniel-rck/Zeiterfassung/blob/main/SECURITY.md"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[color:var(--color-text-2)] hover:underline"
            >
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default WelcomePage
