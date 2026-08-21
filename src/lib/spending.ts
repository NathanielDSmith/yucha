import { parseLocalDate } from './dates'
import { roundCents } from './money'

export interface SpendingEntry {
  id: string
  amount: number
  date: string // ISO yyyy-mm-dd
  categoryId: string
  note?: string
}

export interface CategoryTotal {
  categoryId: string
  total: number
}

export function sumByCategory(entries: SpendingEntry[]): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    totals.set(entry.categoryId, (totals.get(entry.categoryId) ?? 0) + entry.amount)
  }
  return Array.from(totals, ([categoryId, total]) => ({
    categoryId,
    total: roundCents(total),
  }))
}

export function filterByDateRange(
  entries: SpendingEntry[],
  start: Date | null,
  end: Date,
): SpendingEntry[] {
  const endTime = end.getTime()
  const startTime = start?.getTime() ?? -Infinity
  return entries.filter((entry) => {
    const time = parseLocalDate(entry.date).getTime()
    return time >= startTime && time <= endTime
  })
}

export function startOfMonth(asOf: Date = new Date()): Date {
  return new Date(asOf.getFullYear(), asOf.getMonth(), 1)
}

export type RetrospectivePeriod = 'month' | '3months' | '6months' | 'all'

export function periodStart(
  period: RetrospectivePeriod,
  asOf: Date = new Date(),
): Date | null {
  switch (period) {
    case 'month':
      return startOfMonth(asOf)
    case '3months':
      return new Date(asOf.getFullYear(), asOf.getMonth() - 3, asOf.getDate())
    case '6months':
      return new Date(asOf.getFullYear(), asOf.getMonth() - 6, asOf.getDate())
    case 'all':
      return null
  }
}
