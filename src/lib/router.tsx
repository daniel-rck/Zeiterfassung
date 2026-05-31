import { createBrowserRouter, Outlet } from "react-router-dom";
import { GlobalShortcuts } from "../components/GlobalShortcuts";
import { Onboarding } from "../components/Onboarding";
import { SwUpdateNotifier } from "../components/SwUpdateNotifier";
import { AppShellContainer } from "../features/shell/AppShellContainer";
// Today and Welcome are the first-paint routes → keep eager. The remaining
// pages are code-split so the initial bundle stays lean (Reports pulls in the
// charts, Invoice/Invoices pull in jspdf via a further dynamic import).
import { TodayPage } from "../pages/Today";
import { WelcomePage } from "../pages/Welcome";
import { ROUTES } from "./routes.ts";

/** Router-context globals + the routed outlet. */
function RootLayout() {
  return (
    <>
      <SwUpdateNotifier />
      <GlobalShortcuts />
      <Onboarding />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.welcome, element: <WelcomePage /> },
      {
        element: <AppShellContainer />,
        children: [
          { index: true, element: <TodayPage /> },
          {
            path: ROUTES.entries,
            lazy: async () => ({ Component: (await import("../pages/Entries")).EntriesPage }),
          },
          {
            path: ROUTES.week,
            lazy: async () => ({ Component: (await import("../pages/Week")).WeekPage }),
          },
          {
            path: ROUTES.entryNew,
            lazy: async () => ({ Component: (await import("../pages/EntryEdit")).EntryEditPage }),
          },
          {
            path: ROUTES.entry,
            lazy: async () => ({ Component: (await import("../pages/EntryEdit")).EntryEditPage }),
          },
          {
            path: ROUTES.projects,
            lazy: async () => ({ Component: (await import("../pages/Projects")).ProjectsPage }),
          },
          {
            path: ROUTES.tags,
            lazy: async () => ({ Component: (await import("../pages/Tags")).TagsPage }),
          },
          {
            path: ROUTES.reports,
            lazy: async () => ({ Component: (await import("../pages/Reports")).ReportsPage }),
          },
          {
            path: ROUTES.invoice,
            lazy: async () => ({ Component: (await import("../pages/Invoice")).InvoicePage }),
          },
          {
            path: ROUTES.invoices,
            lazy: async () => ({ Component: (await import("../pages/Invoices")).InvoicesPage }),
          },
          {
            path: ROUTES.settings,
            lazy: async () => ({ Component: (await import("../pages/Settings")).SettingsPage }),
          },
        ],
      },
    ],
  },
]);
