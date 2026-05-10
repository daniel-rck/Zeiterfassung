import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './lib/hooks/useTheme'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Confirm'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { GlobalShortcuts } from './components/GlobalShortcuts'
import { TodayPage } from './pages/Today'
import { EntriesPage } from './pages/Entries'
import { EntryEditPage } from './pages/EntryEdit'
import { ProjectsPage } from './pages/Projects'
import { TagsPage } from './pages/Tags'
import { ReportsPage } from './pages/Reports'
import { InvoicePage } from './pages/Invoice'
import { SettingsPage } from './pages/Settings'

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <GlobalShortcuts />
            <Onboarding />
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<TodayPage />} />
                <Route path="entries" element={<EntriesPage />} />
                <Route path="entry/new" element={<EntryEditPage />} />
                <Route path="entry/:id" element={<EntryEditPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="tags" element={<TagsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="invoice" element={<InvoicePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
