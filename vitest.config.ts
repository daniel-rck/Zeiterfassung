import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Tests run through the app's own Vite config, so its plugins, aliases and
// virtual modules resolve exactly as they do in the build.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      css: true,
      // setup.ts is owned by web-base; app-setup.ts holds the app's own resets.
      setupFiles: ["./src/test/setup.ts", "./src/test/app-setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
    },
  }),
);
