import type { ReactNode } from "react";
import { type Theme, type UseThemeResult, useTheme as useBaseTheme } from "../ui/useTheme.ts";

export type { Theme, UseThemeResult };

/**
 * Kept as a provider-shaped API so existing call sites don't change, but the
 * state now lives entirely in the web-base hook.
 *
 * This used to hold the theme in the app's settings blob and express it as a
 * `.dark` class on <html>. Both were forks: a class cannot say "follow the OS"
 * without JavaScript, so a forced choice always flashed the wrong colors until
 * React mounted, and the fleet ended up with three different places to remember
 * a theme. The base hook uses `data-theme`, which CSS alone can resolve.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTheme(): UseThemeResult {
  return useBaseTheme();
}
