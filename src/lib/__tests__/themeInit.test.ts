import { beforeEach, describe, expect, it } from "vitest";
// The real shipped file, not a copy — a copy would drift from what users run.
import SCRIPT from "../../../public/theme-init.js?raw";

/**
 * `public/theme-init.js` runs before the bundle and carries a one-time
 * migration off the pre-0.3 storage shape, where the theme lived inside the
 * settings blob and was expressed as a `.dark` class. Getting it wrong silently
 * resets every existing user's theme, so it is worth a test even though the
 * file is plain JS served as a static asset.
 */
function run(initial: Record<string, string>): {
  store: Record<string, string>;
  attr: string | null;
} {
  const store = { ...initial };
  let attr: string | null = null;
  const localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  const document = {
    documentElement: {
      setAttribute: (_name: string, value: string) => {
        attr = value;
      },
    },
  };
  new Function("localStorage", "document", SCRIPT)(localStorage, document);
  return { store, attr };
}

describe("theme-init", () => {
  beforeEach(() => {
    expect(SCRIPT).toContain("zeiterfassung:settings");
  });

  it("migrates a forced theme out of the old settings blob", () => {
    const { store, attr } = run({
      "zeiterfassung:settings": JSON.stringify({ theme: "dark", locale: "de-DE" }),
    });
    expect(store.theme).toBe("dark");
    expect(attr).toBe("dark");
  });

  it("migrates 'system' without forcing an attribute", () => {
    const { store, attr } = run({
      "zeiterfassung:settings": JSON.stringify({ theme: "system" }),
    });
    expect(store.theme).toBe("system");
    // "system" must leave data-theme unset so CSS falls back to the OS.
    expect(attr).toBeNull();
  });

  it("does not overwrite an already-migrated choice", () => {
    const { store } = run({
      theme: "light",
      "zeiterfassung:settings": JSON.stringify({ theme: "dark" }),
    });
    expect(store.theme).toBe("light");
  });

  it("is a no-op for a first-time visitor", () => {
    const { store, attr } = run({});
    expect(store.theme).toBeUndefined();
    expect(attr).toBeNull();
  });

  it("survives a corrupt settings blob", () => {
    const { store, attr } = run({ "zeiterfassung:settings": "{not json" });
    expect(store.theme).toBeUndefined();
    expect(attr).toBeNull();
  });
});
