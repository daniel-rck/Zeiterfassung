// Round a monetary value to the smallest unit of the currency (cents).
//
// Used for both invoice line items and report aggregates so that displayed
// sums add up consistently across the app: amounts are rounded per entry/line
// up front, then totals are derived from the already-rounded numbers.
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
