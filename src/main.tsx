import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./index.css";
import { UpdatePrompt } from "./lib/pwa/UpdatePrompt.tsx";
import { router } from "./lib/router.tsx";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root fehlt in index.html");
createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
    <UpdatePrompt />
  </StrictMode>,
);
