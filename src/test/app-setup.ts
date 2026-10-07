// App-specific test setup, loaded after the owned src/test/setup.ts (see
// `setupFiles` in vitest.config.ts). Every test starts with empty stores and
// an empty localStorage, so tests in one file can't see each other's data.
import { afterEach } from "vitest";
import { clearAll } from "../lib/db";

afterEach(async () => {
  await clearAll();
  window.localStorage.clear();
});
