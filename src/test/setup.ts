import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { _resetDBForTests, getDB } from "../lib/db";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn<(query: string) => MediaQueryList>().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn<MediaQueryList["addListener"]>(),
    removeListener: vi.fn<MediaQueryList["removeListener"]>(),
    addEventListener: vi.fn<MediaQueryList["addEventListener"]>(),
    removeEventListener: vi.fn<MediaQueryList["removeEventListener"]>(),
    dispatchEvent: vi.fn<MediaQueryList["dispatchEvent"]>(),
  })),
});

afterEach(async () => {
  cleanup();
  try {
    const db = await getDB();
    const tx = db.transaction(
      ["projects", "tags", "time_entries", "invoices", "breaks"],
      "readwrite",
    );
    await tx.objectStore("projects").clear();
    await tx.objectStore("tags").clear();
    await tx.objectStore("time_entries").clear();
    await tx.objectStore("invoices").clear();
    await tx.objectStore("breaks").clear();
    await tx.done;
  } catch {
    // ignore — DB may not exist yet
  }
  await _resetDBForTests();
  window.localStorage.clear();
});
