import {
  DEFAULT_ANNUAL_RETURN_RATE,
  projectCompoundGrowth,
} from './compounding'
import { filterByDateRange, periodStart, sumByCategory } from './spending'
import type { RetrospectivePeriod, SpendingEntry } from './spending'

export interface RetrospectiveRow {
  category: string
  totalSpent: number
  projectedValue: number
  growth: number
}

// Reflects logged spending back at the user as "what this could have
// become" — arithmetic on their own numbers, not a recommendation. Only
// categories the user actually logged spend under appear here; choosing
// to log under a category name is the opt-in (see docs/decisions.md).
export function buildRetrospective(
  entries: SpendingEntry[],
  period: RetrospectivePeriod,
  years: number,
  annualRate: number = DEFAULT_ANNUAL_RETURN_RATE,
  asOf: Date = new Date(),
): RetrospectiveRow[] {
  const scoped = filterByDateRange(entries, periodStart(period, asOf), asOf)
  return sumByCategory(scoped)
    .filter((c) => c.total > 0)
    .map((c) => {
      const projection = projectCompoundGrowth(c.total, years, annualRate)
      return {
        category: c.category,
        totalSpent: c.total,
        projectedValue: projection.futureValue,
        growth: projection.totalGrowth,
      }
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
}
