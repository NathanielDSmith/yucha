// Calculate retirement age based on Japan's pension system
// Currently 65, gradually increasing to 67 by 2013+
function getJapanRetirementAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const birthYear = birthDate.getFullYear()

  // Simplified: use 65 for most people
  // In reality, it's 65 for those born before 1961, increasing to 67 for those born 1973+
  if (birthYear < 1961) return 65
  if (birthYear >= 1973) return 67
  return 65 + Math.floor((birthYear - 1961) / 4) // Incremental increase
}

export function calculatePensionYear(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const retirementAge = getJapanRetirementAge(dateOfBirth)
  const pensionYear = birthDate.getFullYear() + retirementAge

  return pensionYear
}

export function calculateCompoundInterest(principal: number, rate: number, years: number): number {
  return principal * Math.pow(1 + rate / 100, years)
}

export interface OpportunityCostData {
  original: number
  year1: number
  year5: number
  year10: number
  year20: number
  pensionYear?: number
  pensionAmount?: number
}

export function calculateOpportunityCost(
  amount: number,
  annualRate: number = 7,
  dateOfBirth?: string
): OpportunityCostData {
  const data: OpportunityCostData = {
    original: amount,
    year1: calculateCompoundInterest(amount, annualRate, 1),
    year5: calculateCompoundInterest(amount, annualRate, 5),
    year10: calculateCompoundInterest(amount, annualRate, 10),
    year20: calculateCompoundInterest(amount, annualRate, 20),
  }

  if (dateOfBirth) {
    const pensionYear = calculatePensionYear(dateOfBirth)
    const currentYear = new Date().getFullYear()
    const yearsToRetirement = Math.max(0, pensionYear - currentYear)

    if (yearsToRetirement > 0) {
      data.pensionYear = pensionYear
      data.pensionAmount = calculateCompoundInterest(amount, annualRate, yearsToRetirement)
    }
  }

  return data
}
