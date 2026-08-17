import { parseLocalDate } from './dates'
import { roundCents } from './money'

export interface Subscription {
  id: string
  name: string
  category: string
  monthlyAmount: number
  startDate: string // ISO yyyy-mm-dd
  usageCount: number
}

// Whole calendar months paid for, counting the start month itself as
// month 1 (you've paid for the month you signed up in). Clamped at 0 for
// a start date in the future.
export function monthsElapsed(startDate: string, asOf: Date = new Date()): number {
  const start = parseLocalDate(startDate)
  const months =
    (asOf.getFullYear() - start.getFullYear()) * 12 +
    (asOf.getMonth() - start.getMonth()) +
    1
  return Math.max(0, months)
}

export function totalPaid(sub: Subscription, asOf: Date = new Date()): number {
  return roundCents(sub.monthlyAmount * monthsElapsed(sub.startDate, asOf))
}

// null when there's no usage logged yet — there's nothing to divide by,
// and 0 would misleadingly read as "free per use".
export function costPerUse(sub: Subscription, asOf: Date = new Date()): number | null {
  if (sub.usageCount <= 0) return null
  return roundCents(totalPaid(sub, asOf) / sub.usageCount)
}
