import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfirmProvider } from "./components/ui/Confirm";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./lib/hooks/useTheme";
import { router } from "./lib/router";

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
