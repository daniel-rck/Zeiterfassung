import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { endBreak, startBreak } from "../db/breaks";
import { createProject } from "../db/projects";
import {
  createEntry,
  deleteEntry,
  getRunningEntry,
  listEntries,
  startTimer,
  stopTimer,
  updateEntry,
} from "../db/timeEntries";

describe("timer engine", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a running entry when none exists", async () => {
    const entry = await startTimer({ description: "Test" });
    expect(entry.endedAt).toBeUndefined();
    expect(entry.description).toBe("Test");
    const running = await getRunningEntry();
    expect(running?.id).toBe(entry.id);
  });

  it("refuses a second timer while one is running", async () => {
    await startTimer({ description: "A" });
    await expect(startTimer({ description: "B" })).rejects.toThrow(/läuft bereits/);
  });

  it("stops the running timer and computes duration", async () => {
    const t0 = new Date("2026-05-10T10:00:00Z").getTime();
    const t1 = new Date("2026-05-10T10:05:30Z").getTime();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(t0);
    await startTimer({ description: "X" });
    dateSpy.mockReturnValue(t1);
    const stopped = await stopTimer();
    expect(stopped?.durationSec).toBe(330);
    const running = await getRunningEntry();
    expect(running).toBeUndefined();
    dateSpy.mockRestore();
  });

  it("inherits billable + rate from project on start", async () => {
    const project = await createProject({
      name: "Kunde A",
      color: "#000000",
      billableDefault: true,
      hourlyRate: 100,
      currency: "EUR",
      archived: false,
    });
    const entry = await startTimer({ projectId: project.id });
    expect(entry.billable).toBe(true);
    expect(entry.hourlyRateSnapshot).toBe(100);
    expect(entry.currencySnapshot).toBe("EUR");
    await stopTimer();
  });

  it("does not resurrect a stopped entry when a stale edit lands", async () => {
    const entry = await startTimer({ description: "A" });
    await stopTimer();
    // e.g. the description input blurs after the timer was stopped elsewhere
    const updated = await updateEntry(entry.id, { description: "B" });
    expect(updated.endedAt).toBeDefined();
    expect(updated.description).toBe("B");
    expect(await getRunningEntry()).toBeUndefined();
  });

  it("keeps the break deduction on edits without a duration", async () => {
    const t0 = new Date("2026-05-10T10:00:00Z").getTime();
    const spy = vi.spyOn(Date, "now").mockReturnValue(t0);
    const entry = await startTimer();
    spy.mockReturnValue(t0 + 600_000);
    const brk = await startBreak(entry.id);
    spy.mockReturnValue(t0 + 900_000);
    await endBreak(brk.id);
    spy.mockReturnValue(t0 + 3600_000);
    const stopped = await stopTimer();
    expect(stopped?.durationSec).toBe(3600 - 300);
    const edited = await updateEntry(entry.id, { tagIds: ["x"] });
    expect(edited.durationSec).toBe(3300);
    const moved = await updateEntry(entry.id, { endedAt: t0 + 7200_000 });
    expect(moved.durationSec).toBe(7200 - 300);
    spy.mockRestore();
  });

  it("re-snapshots rate and currency when the project changes", async () => {
    const a = await createProject({
      name: "A",
      color: "#000000",
      billableDefault: true,
      hourlyRate: 120,
      currency: "EUR",
      archived: false,
    });
    const b = await createProject({
      name: "B",
      color: "#000000",
      billableDefault: true,
      hourlyRate: 80,
      currency: "USD",
      archived: false,
    });
    const entry = await startTimer({ projectId: a.id });
    const moved = await updateEntry(entry.id, { projectId: b.id });
    expect(moved.hourlyRateSnapshot).toBe(80);
    expect(moved.currencySnapshot).toBe("USD");
    const cleared = await updateEntry(entry.id, { projectId: undefined });
    expect(cleared.hourlyRateSnapshot).toBeUndefined();
    const same = await updateEntry(entry.id, { description: "x" });
    expect(same.hourlyRateSnapshot).toBeUndefined();
    await stopTimer();
  });

  it("creates a manual entry with explicit duration", async () => {
    const start = Date.now() - 2 * 3600_000;
    const end = Date.now();
    const entry = await createEntry({
      description: "Manuell",
      startedAt: start,
      endedAt: end,
      billable: false,
      tagIds: [],
    });
    expect(entry.durationSec).toBe(7200);
  });

  it("updates and deletes", async () => {
    const entry = await createEntry({
      description: "old",
      startedAt: Date.now() - 60_000,
      endedAt: Date.now(),
      billable: false,
      tagIds: [],
    });
    await updateEntry(entry.id, { description: "new" });
    const all = await listEntries();
    expect(all.find((e) => e.id === entry.id)?.description).toBe("new");
    await deleteEntry(entry.id);
    const after = await listEntries();
    expect(after.find((e) => e.id === entry.id)).toBeUndefined();
  });

  it("excludes the running entry by default and includes it on opt-in", async () => {
    await createEntry({
      description: "finished",
      startedAt: Date.now() - 60_000,
      endedAt: Date.now() - 30_000,
      billable: false,
      tagIds: [],
    });
    await startTimer({ description: "live" });

    const defaulted = await listEntries();
    expect(defaulted.some((e) => e.description === "live")).toBe(false);
    expect(defaulted.some((e) => e.description === "finished")).toBe(true);

    const withRunning = await listEntries({ includeRunning: true });
    expect(withRunning.some((e) => e.description === "live")).toBe(true);
  });

  it("books a finished entry spanning midnight on its start day only", async () => {
    const start = new Date("2026-05-10T23:00:00Z").getTime();
    const end = new Date("2026-05-11T01:00:00Z").getTime();
    await createEntry({
      description: "cross",
      startedAt: start,
      endedAt: end,
      billable: false,
      tagIds: [],
    });
    const prev = await listEntries({
      from: new Date("2026-05-10T00:00:00Z").getTime(),
      to: new Date("2026-05-10T23:59:59Z").getTime(),
    });
    const next = await listEntries({
      from: new Date("2026-05-11T00:00:00Z").getTime(),
      to: new Date("2026-05-11T23:59:59Z").getTime(),
    });
    expect(prev.some((e) => e.description === "cross")).toBe(true);
    expect(next.some((e) => e.description === "cross")).toBe(false);
  });

  it("keeps a running entry started before the range visible", async () => {
    const start = Date.now() - 3 * 3600_000;
    vi.spyOn(Date, "now").mockReturnValue(start);
    await startTimer({ description: "overnight" });
    vi.restoreAllMocks();
    const range = await listEntries({
      from: start + 3600_000,
      to: start + 7200_000,
      includeRunning: true,
    });
    expect(range.some((e) => e.description === "overnight")).toBe(true);
  });

  it("keeps a running entry inside an open range", async () => {
    const start = Date.now() - 3600_000;
    vi.spyOn(Date, "now").mockReturnValue(start);
    await startTimer({ description: "running" });
    vi.restoreAllMocks();
    const range = await listEntries({
      from: start - 60_000,
      to: start + 7200_000,
      includeRunning: true,
    });
    expect(range.some((e) => e.description === "running")).toBe(true);
  });
});
