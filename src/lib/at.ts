/**
 * Read `arr[i]` where the index is provably in range — a bounded loop, a
 * non-empty literal, or an access guarded by a prior length check.
 *
 * `noUncheckedIndexedAccess` cannot see those proofs, so every such read widens
 * to `T | undefined`. A `!` assertion would drop the check entirely; this keeps
 * a real runtime check and fails loudly if an assumption stops holding.
 */
export function at<T>(arr: ArrayLike<T>, i: number): T {
  const value = arr[i];
  if (value === undefined) {
    throw new RangeError(`Index ${i} is out of range (length ${arr.length}).`);
  }
  return value;
}
