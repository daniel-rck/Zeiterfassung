export const ROUTES = {
  home: "/",
  welcome: "/willkommen",
  entries: "/entries",
  week: "/week",
  entryNew: "/entry/new",
  entry: "/entry/:id",
  projects: "/projects",
  tags: "/tags",
  reports: "/reports",
  invoice: "/invoice",
  invoices: "/invoices",
  settings: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
