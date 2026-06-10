import { describe, expect, it } from "vitest";
import { listBreaksByEntry, startBreak } from "../../db/breaks";
import { listProjects } from "../../db/projects";
import { listEntries, startTimer, stopTimer } from "../../db/timeEntries";
import { buildSnapshot } from "../exportJson";
import { importSnapshot } from "../importJson";

const VALID_SNAPSHOT = {
  app: "zeiterfassung",
  schemaVersion: 1,
  exportedAt: 0,
  projects: [
    {
      id: "p1",
      name: "Projekt 1",
      color: "#000",
      billableDefault: false,
      archived: false,
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  tags: [],
  timeEntries: [
    {
      id: "e1",
      description: "test",
      startedAt: 1_000_000_000_000,
      endedAt: 1_000_000_010_000,
      durationSec: 10,
      billable: false,
      tagIds: [],
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  settings: {
    detailLevel: "standard",
    onboardingCompleted: true,
    defaultBillable: false,
    currency: "EUR",
    locale: "de-DE",
    weekStart: 1,
    theme: "system",
    roundTo: 0,
  },
};

describe("importSnapshot", () => {
  it("rejects malformed JSON without touching the DB", async () => {
    await expect(importSnapshot("not json")).rejects.toThrow(/gültiges JSON/);
  });

  it("rejects non-backup payloads", async () => {
    await expect(importSnapshot(JSON.stringify({ foo: "bar" }))).rejects.toThrow(/Backup/);
  });

  it("rejects duplicate project ids before clearing the DB", async () => {
    const dup = {
      ...VALID_SNAPSHOT,
      projects: [VALID_SNAPSHOT.projects[0], { ...VALID_SNAPSHOT.projects[0] }],
    };
    await expect(importSnapshot(JSON.stringify(dup))).rejects.toThrow(/doppelte ID/);
    // DB should remain empty since the validation ran first.
    const projects = await listProjects();
    expect(projects).toHaveLength(0);
  });

  it("rejects entries with invalid startedAt", async () => {
    const bad = {
      ...VALID_SNAPSHOT,
      timeEntries: [{ ...VALID_SNAPSHOT.timeEntries[0], startedAt: "oops" }],
    };
    await expect(importSnapshot(JSON.stringify(bad))).rejects.toThrow(/Startzeitpunkt/);
  });

  it("rejects entries with missing or invalid durationSec", async () => {
    const bad = {
      ...VALID_SNAPSHOT,
      timeEntries: [{ ...VALID_SNAPSHOT.timeEntries[0], durationSec: undefined }],
    };
    await expect(importSnapshot(JSON.stringify(bad))).rejects.toThrow(/Dauer/);
  });

  it("rejects entries with non-string description", async () => {
    const bad = {
      ...VALID_SNAPSHOT,
      timeEntries: [{ ...VALID_SNAPSHOT.timeEntries[0], description: 42 }],
    };
    await expect(importSnapshot(JSON.stringify(bad))).rejects.toThrow(/Beschreibung/);
  });

  it("rejects entries with non-boolean billable", async () => {
    const bad = {
      ...VALID_SNAPSHOT,
      timeEntries: [{ ...VALID_SNAPSHOT.timeEntries[0], billable: "ja" }],
    };
    await expect(importSnapshot(JSON.stringify(bad))).rejects.toThrow(/abrechenbar/);
  });

  it("imports a valid snapshot end-to-end", async () => {
    const result = await importSnapshot(JSON.stringify(VALID_SNAPSHOT));
    expect(result).toEqual({ projects: 1, tags: 0, timeEntries: 1 });
    const entries = await listEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].description).toBe("test");
  });

  it("roundtrips breaks through export and import", async () => {
    const entry = await startTimer({ description: "work" });
    await startBreak(entry.id);
    await stopTimer();
    const snapshot = await buildSnapshot();
    expect(snapshot.breaks).toHaveLength(1);

    await importSnapshot(JSON.stringify(snapshot));
    const breaks = await listBreaksByEntry(entry.id);
    expect(breaks).toHaveLength(1);
    expect(breaks[0]?.endedAt).toBeDefined();
  });

  it("clears stale breaks when importing a backup without breaks", async () => {
    const entry = await startTimer({ description: "work" });
    await startBreak(entry.id);
    await stopTimer();
    expect(await listBreaksByEntry(entry.id)).toHaveLength(1);

    await importSnapshot(JSON.stringify(VALID_SNAPSHOT));
    expect(await listBreaksByEntry(entry.id)).toHaveLength(0);
  });

  it("rejects breaks without entryId", async () => {
    const bad = {
      ...VALID_SNAPSHOT,
      breaks: [{ id: "b1", startedAt: 1, durationSec: 0, createdAt: 0, updatedAt: 0 }],
    };
    await expect(importSnapshot(JSON.stringify(bad))).rejects.toThrow(/entryId/);
  });

  it("rejects breaks with invalid durationSec or endedAt", async () => {
    const base = { id: "b1", entryId: "e1", startedAt: 1, createdAt: 0, updatedAt: 0 };
    const badDuration = { ...VALID_SNAPSHOT, breaks: [{ ...base, durationSec: "5" }] };
    await expect(importSnapshot(JSON.stringify(badDuration))).rejects.toThrow(/Dauer/);
    const badEnded = { ...VALID_SNAPSHOT, breaks: [{ ...base, durationSec: 5, endedAt: "x" }] };
    await expect(importSnapshot(JSON.stringify(badEnded))).rejects.toThrow(/Endzeitpunkt/);
  });
});
