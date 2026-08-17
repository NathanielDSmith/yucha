import type { SpendingEntry } from './spending'

export const RECOMMENDED_MONTHS = 6
export const MINIMUM_MONTHS = 3

export interface EmergencyFundMetrics {
  monthsOfRunway: number
  adequacyRatio: number
  isAdequate: boolean
  status: 'critical' | 'low' | 'moderate' | 'good' | 'excellent'
}

export function calculateAverageMonthlySpending(entries: SpendingEntry[]): number {
  if (entries.length === 0) return 0

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const recentEntries = entries.filter((e) => {
    const entryDate = new Date(e.date)
    return entryDate >= sixMonthsAgo
  })

  if (recentEntries.length === 0) return 0

  const totalSpending = recentEntries.reduce((sum, e) => sum + e.amount, 0)
  const monthsOfData = Math.min(6, Math.max(1, Math.floor(recentEntries.length / 15)))

  return totalSpending / monthsOfData
}

export function getEmergencyFundMetrics(
  emergencyFundBalance: number,
  spendingEntries: SpendingEntry[],
): EmergencyFundMetrics {
  const monthlySpending = calculateAverageMonthlySpending(spendingEntries)

  if (monthlySpending <= 0) {
    return {
      monthsOfRunway: 0,
      adequacyRatio: 0,
      isAdequate: false,
      status: 'critical',
    }
  }

  const monthsOfRunway = emergencyFundBalance / monthlySpending
  const adequacyRatio = monthsOfRunway / RECOMMENDED_MONTHS
  const isAdequate = monthsOfRunway >= RECOMMENDED_MONTHS

  let status: 'critical' | 'low' | 'moderate' | 'good' | 'excellent'
  if (monthsOfRunway < MINIMUM_MONTHS) status = 'critical'
  else if (monthsOfRunway < RECOMMENDED_MONTHS * 0.5) status = 'low'
  else if (monthsOfRunway < RECOMMENDED_MONTHS) status = 'moderate'
  else if (monthsOfRunway < RECOMMENDED_MONTHS * 1.5) status = 'good'
  else status = 'excellent'

  return {
    monthsOfRunway,
    adequacyRatio: Math.min(1, adequacyRatio),
    isAdequate,
    status,
  }
}
