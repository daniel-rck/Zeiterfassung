import { Outlet, ScrollRestoration } from "react-router-dom";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { Onboarding } from "./components/Onboarding";
import { ConfirmProvider } from "./components/ui/Confirm";
import { ToastProvider } from "./components/ui/Toast";

/**
 * The root layout route: app-wide providers and listeners around every page.
 * Unlike the web-base template, the shell (AppShellContainer) is a nested
 * layout route below this one, because the welcome page renders without it.
 */
export function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <GlobalShortcuts />
        <Onboarding />
        <Outlet />
        <ScrollRestoration />
      </ConfirmProvider>
    </ToastProvider>
  );
}
