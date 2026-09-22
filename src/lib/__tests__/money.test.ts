import { describe, expect, it } from "vitest";
import { roundCents } from "../money";

describe("roundCents", () => {
  it("rounds half-cents that are inexact in binary up", () => {
    expect(roundCents(1.005)).toBe(1.01);
    expect(roundCents(10.075)).toBe(10.08);
    expect(roundCents(2.675)).toBe(2.68);
  });

  it("is symmetric for negative values and leaves exact values alone", () => {
    expect(roundCents(-1.005)).toBe(-1.01);
    expect(roundCents(0)).toBe(0);
    expect(roundCents(1.004)).toBe(1);
    expect(roundCents(0.1 + 0.2)).toBe(0.3);
  });
});
