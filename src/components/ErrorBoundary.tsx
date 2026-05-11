import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[zeiterfassung] uncaught render error', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto mt-10 max-w-lg p-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Da ist etwas schiefgegangen.
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Die App konnte diesen Bereich nicht anzeigen. Deine Daten liegen weiterhin
              lokal in deinem Browser. Lade die Seite neu oder versuche es nochmal.
            </p>
            <pre className="mt-3 overflow-x-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={this.reset}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Erneut versuchen
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
