export type IncomeType = 'job' | 'side-gig' | 'investment' | 'other'
export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface IncomeSource {
  id: string
  name: string
  type: IncomeType
  amount: number // Can be base amount (use minAmount/maxAmount for variable)
  minAmount?: number // For variable income
  maxAmount?: number // For variable income
  frequency: IncomeFrequency
  dayOfMonth?: number // When recurring income arrives (1-31 for monthly, etc.)
  startDate: string // ISO date string
  isActive: boolean
  createdAt: string
}

// Convert frequency to multiplier for monthly calculation
function frequencyToMonthlyMultiplier(frequency: IncomeFrequency): number {
  switch (frequency) {
    case 'weekly': return 52 / 12 // ~4.33 weeks per month
    case 'biweekly': return 26 / 12 // ~2.17 periods per month
    case 'monthly': return 1
    case 'yearly': return 1 / 12
  }
}

// Calculate monthly income for a single source
export function calculateMonthlyIncome(source: IncomeSource): number {
  const baseAmount = source.amount
  const multiplier = frequencyToMonthlyMultiplier(source.frequency)
  return baseAmount * multiplier
}

// Calculate total monthly income from all sources
export function calculateTotalMonthlyIncome(sources: IncomeSource[]): number {
  return sources
    .filter((s) => s.isActive)
    .reduce((total, source) => {
      // Use average for variable income, regular calculation for fixed
      if (source.minAmount !== undefined && source.maxAmount !== undefined) {
        return total + calculateAverageMonthlyIncome(source)
      }
      return total + calculateMonthlyIncome(source)
    }, 0)
}

// For variable income, calculate average
export function calculateAverageMonthlyIncome(source: IncomeSource): number {
  if (source.minAmount !== undefined && source.maxAmount !== undefined) {
    const average = (source.minAmount + source.maxAmount) / 2
    const multiplier = frequencyToMonthlyMultiplier(source.frequency)
    return average * multiplier
  }
  return calculateMonthlyIncome(source)
}

// Get income range for variable income
export function getIncomeRange(source: IncomeSource): { min: number; max: number } {
  const multiplier = frequencyToMonthlyMultiplier(source.frequency)
  const min = (source.minAmount ?? source.amount) * multiplier
  const max = (source.maxAmount ?? source.amount) * multiplier
  return { min, max }
}

// Calculate total income range for all sources
export function calculateIncomeRange(sources: IncomeSource[]): { min: number; max: number } {
  const activeSources = sources.filter((s) => s.isActive)

  let totalMin = 0
  let totalMax = 0

  activeSources.forEach((source) => {
    const range = getIncomeRange(source)
    totalMin += range.min
    totalMax += range.max
  })

  return { min: totalMin, max: totalMax }
}
