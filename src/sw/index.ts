/// <reference lib="webworker" />
import { registerAppShell } from "./base.ts";

// Precache, offline navigation (index.html for every deep link) and
// prompt-based updates (owned: base.ts). The app has no handlers of its own.
registerAppShell();
