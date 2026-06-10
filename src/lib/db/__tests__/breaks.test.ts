import { describe, expect, it, vi } from "vitest";
import { endBreak, endRunningBreakFor, listBreaksByEntry, startBreak } from "../breaks";
import { startTimer, stopTimer } from "../timeEntries";

const MIN = 60_000;

describe("breaks", () => {
  it("starts a break and is idempotent while one is running", async () => {
    const entry = await startTimer({ description: "work" });
    const first = await startBreak(entry.id);
    expect(first.endedAt).toBeUndefined();
    const second = await startBreak(entry.id);
    expect(second.id).toBe(first.id);
    const all = await listBreaksByEntry(entry.id);
    expect(all).toHaveLength(1);
  });

  it("endBreak sets endedAt and durationSec", async () => {
    const t0 = new Date("2026-06-01T10:00:00Z").getTime();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(t0);
    const entry = await startTimer({ description: "work" });
    const brk = await startBreak(entry.id);
    dateSpy.mockReturnValue(t0 + 5 * MIN);
    const ended = await endBreak(brk.id);
    expect(ended?.endedAt).toBe(t0 + 5 * MIN);
    expect(ended?.durationSec).toBe(300);
    dateSpy.mockRestore();
  });

  it("endRunningBreakFor ends only the open break", async () => {
    const entry = await startTimer({ description: "work" });
    const brk = await startBreak(entry.id);
    await endBreak(brk.id);
    expect(await endRunningBreakFor(entry.id)).toBeNull();
    const again = await startBreak(entry.id);
    const ended = await endRunningBreakFor(entry.id);
    expect(ended?.id).toBe(again.id);
    expect(ended?.endedAt).toBeDefined();
  });

  it("stopTimer subtracts finished break time from the duration", async () => {
    const t0 = new Date("2026-06-01T10:00:00Z").getTime();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(t0);
    const entry = await startTimer({ description: "work" });
    dateSpy.mockReturnValue(t0 + 10 * MIN);
    const brk = await startBreak(entry.id);
    dateSpy.mockReturnValue(t0 + 25 * MIN);
    await endBreak(brk.id);
    dateSpy.mockReturnValue(t0 + 60 * MIN);
    const stopped = await stopTimer();
    // 60 min gross − 15 min break = 45 min
    expect(stopped?.durationSec).toBe(45 * 60);
    expect(stopped?.id).toBe(entry.id);
    dateSpy.mockRestore();
  });

  it("stopTimer ends a still-running break and subtracts it", async () => {
    const t0 = new Date("2026-06-01T10:00:00Z").getTime();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(t0);
    const entry = await startTimer({ description: "work" });
    dateSpy.mockReturnValue(t0 + 30 * MIN);
    await startBreak(entry.id);
    dateSpy.mockReturnValue(t0 + 50 * MIN);
    const stopped = await stopTimer();
    // 50 min gross − 20 min break (auto-ended at stop) = 30 min
    expect(stopped?.durationSec).toBe(30 * 60);
    const breaks = await listBreaksByEntry(entry.id);
    expect(breaks).toHaveLength(1);
    expect(breaks[0]?.endedAt).toBe(t0 + 50 * MIN);
    expect(breaks[0]?.durationSec).toBe(20 * 60);
    dateSpy.mockRestore();
  });
});
