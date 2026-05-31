import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,woff2}"],
      },
      manifest: {
        name: "Zeiterfassung",
        short_name: "Zeiterfassung",
        description:
          "Zeiterfassung — Timer, Projekte, Tags und Reports. Ohne Account, alles lokal im Browser.",
        theme_color: "#2563eb",
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
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
