import { describe, expect, it } from "vitest";
import { parseDecimal } from "../Input";

describe("parseDecimal", () => {
  it("accepts comma and dot decimals", () => {
    expect(parseDecimal("37,5")).toBe(37.5);
    expect(parseDecimal("37.5")).toBe(37.5);
    expect(parseDecimal("  ")).toBeUndefined();
  });

  it("rejects units and overflowing digit strings", () => {
    expect(parseDecimal("90 €")).toBeNull();
    expect(parseDecimal("9".repeat(400))).toBeNull();
  });
});
