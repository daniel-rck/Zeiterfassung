import { describe, expect, it } from "vitest";
import {
  groupByDay,
  groupByProject,
  totalBillableAmount,
  totalDurationSec,
} from "../reports/aggregate";
import type { Project, TimeEntry } from "../types";

const project: Project = {
  id: "p1",
  name: "Kunde",
  color: "#000",
  hourlyRate: 100,
  currency: "EUR",
  billableDefault: true,
  archived: false,
  createdAt: 0,
  updatedAt: 0,
};

const day1 = new Date("2026-05-10T09:00:00").getTime();
const day2 = new Date("2026-05-11T09:00:00").getTime();

const entries: TimeEntry[] = [
  {
    id: "e1",
    projectId: "p1",
    description: "",
    startedAt: day1,
    endedAt: day1 + 3600_000,
    durationSec: 3600,
    billable: true,
    tagIds: [],
    hourlyRateSnapshot: 100,
    currencySnapshot: "EUR",
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "e2",
    projectId: "p1",
    description: "",
    startedAt: day1 + 4 * 3600_000,
    endedAt: day1 + 5.5 * 3600_000,
    durationSec: 5400,
    billable: false,
    tagIds: [],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "e3",
    projectId: undefined,
    description: "",
    startedAt: day2,
    endedAt: day2 + 1800_000,
    durationSec: 1800,
    billable: false,
    tagIds: [],
    createdAt: 0,
    updatedAt: 0,
  },
];

describe("aggregate", () => {
  it("totals duration", () => {
    expect(totalDurationSec(entries, { roundToMinutes: 0 })).toBe(3600 + 5400 + 1800);
  });

  it("rounds totals to 15 minutes", () => {
    // 3600 → 3600, 5400 → 5400, 1800 → 1800. With 30-min round: 3600, 5400, 1800
    const total = totalDurationSec(entries, { roundToMinutes: 30 });
    expect(total).toBe(3600 + 5400 + 1800);
  });

  it("groups by day", () => {
    const buckets = groupByDay(entries, [project], { roundToMinutes: 0 });
    expect(buckets).toHaveLength(2);
    expect(buckets[0].durationSec).toBe(9000);
    expect(buckets[1].durationSec).toBe(1800);
  });

  it("groups by project, separates ohne Projekt", () => {
    const buckets = groupByProject(entries, [project], { roundToMinutes: 0 });
    expect(buckets).toHaveLength(2);
    const withProj = buckets.find((b) => b.projectId === "p1")!;
    const noProj = buckets.find((b) => b.projectId === null)!;
    expect(withProj.durationSec).toBe(9000);
    expect(withProj.billableSec).toBe(3600);
    expect(noProj.projectName).toBe("Ohne Projekt");
  });

  it("computes billable amount from snapshot rate", () => {
    const { amount, currency } = totalBillableAmount(entries, [project], { roundToMinutes: 0 });
    expect(amount).toBe(100); // 1 hour billable * 100 EUR
    expect(currency).toBe("EUR");
  });

  it("rounds per-entry amounts to cents (matches invoice composition)", () => {
    // 3 × 20min @ 100/h → 33.333… each. Rounded to cents per entry: 33.33,
    // summing to 99.99 — consistent with how invoice line items are rounded,
    // instead of an unrounded 99.99999….
    const twentyMin: TimeEntry[] = [0, 1, 2].map((i) => ({
      id: `r${i}`,
      projectId: "p1",
      description: "",
      startedAt: day1 + i * 3600_000,
      endedAt: day1 + i * 3600_000 + 1200_000,
      durationSec: 1200,
      billable: true,
      tagIds: [],
      hourlyRateSnapshot: 100,
      currencySnapshot: "EUR",
      createdAt: 0,
      updatedAt: 0,
    }));
    const { amount } = totalBillableAmount(twentyMin, [project], { roundToMinutes: 0 });
    expect(amount).toBe(99.99);
  });
});
