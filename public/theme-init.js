/*
 * Apply the persisted theme before first paint, so a forced light/dark choice
 * doesn't flash the wrong colors on load.
 *
 * External file rather than an inline <script>: the worker CSP would otherwise
 * have to pin a sha256 hash of this snippet, and that hash breaks the theme
 * silently the moment the snippet changes.
 */
(() => {
  try {
    // One-time migration: the theme used to live inside the settings blob and
    // was expressed as a `.dark` class. It has its own key now, so this script
    // can read it synchronously and CSS can resolve "system" without JS.
    if (!localStorage.getItem("theme")) {
      const raw = localStorage.getItem("zeiterfassung:settings");
      const legacy = raw ? JSON.parse(raw).theme : null;
      if (legacy === "light" || legacy === "dark" || legacy === "system") {
        localStorage.setItem("theme", legacy);
      }
    }
    const t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch {
    /* localStorage unavailable (private mode, quota) — fall back to the OS. */
  }
})();
