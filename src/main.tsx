import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./index.css";
import App from "./App.tsx";

// After a deploy the new service worker takes over immediately and drops the
// old hashed chunks, so a tab still running the previous build fails on its
// next lazy route. Reload once to pick up the new build instead of showing
// the error boundary; the session flag stops a reload loop if the chunk is
// genuinely unavailable (e.g. offline without a cached copy).
window.addEventListener("vite:preloadError", (event) => {
  try {
    if (sessionStorage.getItem("chunk-reload") === "1") return;
    sessionStorage.setItem("chunk-reload", "1");
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});
window.addEventListener("load", () => {
  // A successful boot clears the guard so the next deploy can reload again.
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem("chunk-reload");
    } catch {
      // ignore
    }
  }, 5000);
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root fehlt in index.html");
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
