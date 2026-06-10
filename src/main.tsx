import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./index.css";
import App from "./App.tsx";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root fehlt in index.html");
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
