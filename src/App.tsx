import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './lib/hooks/useTheme'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Confirm'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { GlobalShortcuts } from './components/GlobalShortcuts'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SwUpdateNotifier } from './components/SwUpdateNotifier'
// Today and Welcome are the first-paint routes → keep eager. The remaining
// pages are code-split so the initial bundle stays lean (Reports pulls in the
// charts, Invoice/Invoices pull in jspdf via a further dynamic import).
import { TodayPage } from './pages/Today'
import { WelcomePage } from './pages/Welcome'

const EntriesPage = lazy(() =>
  import('./pages/Entries').then((m) => ({ default: m.EntriesPage })),
)
const WeekPage = lazy(() =>
  import('./pages/Week').then((m) => ({ default: m.WeekPage })),
)
const EntryEditPage = lazy(() =>
  import('./pages/EntryEdit').then((m) => ({ default: m.EntryEditPage })),
)
const ProjectsPage = lazy(() =>
  import('./pages/Projects').then((m) => ({ default: m.ProjectsPage })),
)
const TagsPage = lazy(() =>
  import('./pages/Tags').then((m) => ({ default: m.TagsPage })),
)
const ReportsPage = lazy(() =>
  import('./pages/Reports').then((m) => ({ default: m.ReportsPage })),
)
const InvoicePage = lazy(() =>
  import('./pages/Invoice').then((m) => ({ default: m.InvoicePage })),
)
const InvoicesPage = lazy(() =>
  import('./pages/Invoices').then((m) => ({ default: m.InvoicesPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.SettingsPage })),
)

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <SwUpdateNotifier />
            <BrowserRouter>
              <GlobalShortcuts />
              <Onboarding />
              <Routes>
                <Route path="/willkommen" element={<WelcomePage />} />
                <Route element={<AppShell />}>
                  <Route index element={<TodayPage />} />
                  <Route path="entries" element={<EntriesPage />} />
                  <Route path="week" element={<WeekPage />} />
                  <Route path="entry/new" element={<EntryEditPage />} />
                  <Route path="entry/:id" element={<EntryEditPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="tags" element={<TagsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="invoice" element={<InvoicePage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
