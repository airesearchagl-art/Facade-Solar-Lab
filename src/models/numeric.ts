/** Reject unsupported arithmetic results; never repair them with a silent clamp. */
export function finiteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must remain finite and non-negative`);
  }
  return value;
}
