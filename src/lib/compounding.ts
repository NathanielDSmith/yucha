import { roundCents } from './money'

// A commonly cited long-run, inflation-adjusted average stock market return.
// This is a starting-point default for the UI to pre-fill, not a promise —
// every projection using it must be shown next to a disclaimer, and the
// user can always override it.
export const DEFAULT_ANNUAL_RETURN_RATE = 0.07

export interface CompoundingProjection {
  principal: number
  years: number
  annualRate: number
  futureValue: number
  totalGrowth: number
}

export function projectCompoundGrowth(
  principal: number,
  years: number,
  annualRate: number = DEFAULT_ANNUAL_RETURN_RATE,
): CompoundingProjection {
  const futureValue = roundCents(principal * Math.pow(1 + annualRate, years))

  return {
    principal,
    years,
    annualRate,
    futureValue,
    totalGrowth: roundCents(futureValue - principal),
  }
}
