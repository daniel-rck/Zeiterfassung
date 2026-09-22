// Round a monetary value to the smallest unit of the currency (cents).
//
// Used for both invoice line items and report aggregates so that displayed
// sums add up consistently across the app: amounts are rounded per entry/line
// up front, then totals are derived from the already-rounded numbers.
export function roundCents(value: number): number {
  // `value * 100` alone misrounds half-cents that aren't exact in binary
  // (1.005 * 100 === 100.49999…), so nudge by one ulp-scale epsilon, away
  // from zero, before rounding.
  const nudged = value * 100 + Math.sign(value) * Number.EPSILON * Math.abs(value * 100);
  return Math.round(nudged) / 100;
}
