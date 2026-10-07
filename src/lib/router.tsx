import { createBrowserRouter } from "react-router-dom";
import { App } from "../App.tsx";
import { AppShellContainer } from "../features/shell/AppShellContainer";
// Today and Welcome are the first-paint routes → keep eager. The remaining
// pages are code-split so the initial bundle stays lean (Reports pulls in the
// charts, Invoice/Invoices pull in jspdf via a further dynamic import).
import { TodayPage } from "../pages/Today";
import { WelcomePage } from "../pages/Welcome";
import { ROUTES } from "./routes.ts";
import { NotFound } from "./routing/NotFound.tsx";
import { RouteError } from "./routing/RouteError.tsx";
import { RouteFallback } from "./routing/RouteFallback.tsx";

export const router = createBrowserRouter([
  {
    // The root layout route: providers and global listeners (src/App.tsx).
    path: ROUTES.home,
    Component: App,
    ErrorBoundary: RouteError,
    HydrateFallback: RouteFallback,
    children: [
      { path: ROUTES.welcome, Component: WelcomePage },
      {
        // The shell around every app page.
        Component: AppShellContainer,
        children: [
          {
            // A page error renders inside the shell, so the navigation keeps working.
            ErrorBoundary: RouteError,
            children: [
              { index: true, Component: TodayPage },
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
                lazy: async () => ({
                  Component: (await import("../pages/EntryEdit")).EntryEditPage,
                }),
              },
              {
                path: ROUTES.entry,
                lazy: async () => ({
                  Component: (await import("../pages/EntryEdit")).EntryEditPage,
                }),
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
              { path: "*", Component: NotFound },
            ],
          },
        ],
      },
    ],
  },
]);
