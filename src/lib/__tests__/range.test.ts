import { describe, expect, it } from "vitest";
import { getRange } from "../reports/range";

const ref = new Date("2026-05-13T15:00:00").getTime(); // Wednesday

describe("getRange", () => {
  it("returns today range", () => {
    const range = getRange("today", 1, ref)!;
    const from = new Date(range.from);
    const to = new Date(range.to);
    expect(from.getDate()).toBe(13);
    expect(from.getHours()).toBe(0);
    expect(to.getHours()).toBe(23);
  });

  it("returns thisWeek starting Monday", () => {
    const range = getRange("thisWeek", 1, ref)!;
    const from = new Date(range.from);
    expect(from.getDay()).toBe(1); // Monday
    expect(from.getDate()).toBe(11);
  });

  it("returns thisWeek starting Sunday", () => {
    const range = getRange("thisWeek", 0, ref)!;
    const from = new Date(range.from);
    expect(from.getDay()).toBe(0); // Sunday
    expect(from.getDate()).toBe(10);
  });

  it("returns lastMonth as April", () => {
    const range = getRange("lastMonth", 1, ref)!;
    const from = new Date(range.from);
    const to = new Date(range.to);
    expect(from.getMonth()).toBe(3); // April (0-indexed)
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(3);
    expect(to.getDate()).toBe(30);
  });

  it("returns null for custom", () => {
    expect(getRange("custom", 1, ref)).toBeNull();
  });
});
