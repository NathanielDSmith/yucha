import type { SpendingEntry } from './spending'

export interface BurnRateMetrics {
  dailyBurnRate: number
  monthlyBurnRate: number
  daysOfRunway: number
  weeksOfRunway: number
  monthsOfRunway: number
  trend: 'accelerating' | 'stable' | 'improving'
  trendPercentage: number
}

export function calculateBurnRateMetrics(
  currentBalance: number,
  spendingEntries: SpendingEntry[],
): BurnRateMetrics {
  if (spendingEntries.length === 0 || currentBalance <= 0) {
    return {
      dailyBurnRate: 0,
      monthlyBurnRate: 0,
      daysOfRunway: 0,
      weeksOfRunway: 0,
      monthsOfRunway: 0,
      trend: 'stable',
      trendPercentage: 0,
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const last30Days = spendingEntries.filter((e) => {
    const entryDate = new Date(e.date)
    return entryDate >= thirtyDaysAgo
  })

  const prev30Days = spendingEntries.filter((e) => {
    const entryDate = new Date(e.date)
    return entryDate >= sixtyDaysAgo && entryDate < thirtyDaysAgo
  })

  const monthlyBurnRate =
    last30Days.reduce((sum, e) => sum + e.amount, 0) / 30 || 0
  const prevMonthlyBurnRate =
    prev30Days.reduce((sum, e) => sum + e.amount, 0) / 30 || 0

  const dailyBurnRate = monthlyBurnRate / 30
  const daysOfRunway = dailyBurnRate > 0 ? currentBalance / dailyBurnRate : 0
  const weeksOfRunway = daysOfRunway / 7
  const monthsOfRunway = daysOfRunway / 30

  let trend: 'accelerating' | 'stable' | 'improving' = 'stable'
  let trendPercentage = 0

  if (prevMonthlyBurnRate > 0) {
    trendPercentage =
      ((monthlyBurnRate - prevMonthlyBurnRate) / prevMonthlyBurnRate) * 100

    if (trendPercentage > 5) {
      trend = 'accelerating'
    } else if (trendPercentage < -5) {
      trend = 'improving'
    }
  }

  return {
    dailyBurnRate,
    monthlyBurnRate,
    daysOfRunway,
    weeksOfRunway,
    monthsOfRunway,
    trend,
    trendPercentage,
  }
}

export function formatRunway(days: number): string {
  if (days < 1) return 'Less than 1 day'
  if (days < 7) return `${Math.floor(days)} days`
  if (days < 30) return `${Math.floor(days / 7)} weeks`
  return `${(days / 30).toFixed(1)} months`
}
