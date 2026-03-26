/**
 * Truncates to 2 decimal places (no rounding). e.g. 3.456 → 3.45
 * Used for delivery time calculations.
 */
export const roundDown = (value: number): number =>
  Math.trunc(value * 100) / 100;

/**
 * Rounds to 2 decimal places. e.g. 3.456 → 3.46
 * Used for monetary values (discount, total cost)
 */
export const roundUp = (value: number): number =>
  Math.round(value * 100) / 100;
