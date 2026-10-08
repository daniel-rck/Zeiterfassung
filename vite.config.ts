import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// A plain object, not the function form: vitest.config.ts merges it.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "index.ts",
      // A new version waits for the user's go (UpdatePrompt); see src/sw/base.ts.
      registerType: "prompt",
      injectRegister: "auto",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,woff2}"],
      },
      manifest: {
        name: "Zeiterfassung",
        short_name: "Zeiterfassung",
        description:
          "Zeiterfassung — Timer, Projekte, Tags und Reports. Ohne Account, alles lokal im Browser.",
        // accent-600 of hue 255 as hex (04-layout-system.md)
        theme_color: "#005cc2",
        background_color: "#0a0e14",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "de",
        icons: [
          {
            src: "/logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/logo-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Timer starten",
            short_name: "Timer",
            url: "/?action=start",
            icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
          },
          {
            name: "Neuer Eintrag",
            short_name: "Eintrag",
            url: "/entry/new",
            icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
          },
          {
            name: "Reports",
            short_name: "Reports",
            url: "/reports",
            icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
