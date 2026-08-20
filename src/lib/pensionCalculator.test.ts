import { describe, expect, it } from 'vitest'
import {
  calculateCompoundInterest,
  calculateOpportunityCost,
  calculatePensionYear,
} from './pensionCalculator'

describe('calculateCompoundInterest', () => {
  it('calculates growth at 7% annual return for 1 year', () => {
    const result = calculateCompoundInterest(1000, 7, 1)
    expect(result).toBeCloseTo(1070, 0)
  })

  it('calculates compound growth over multiple years', () => {
    const result = calculateCompoundInterest(1000, 7, 5)
    // 1000 * (1.07^5) = 1402.55...
    expect(result).toBeCloseTo(1402.55, 1)
  })

  it('handles 0 years (returns principal)', () => {
    const result = calculateCompoundInterest(1000, 7, 0)
    expect(result).toBe(1000)
  })

  it('handles negative rates (depreciation)', () => {
    const result = calculateCompoundInterest(1000, -5, 2)
    // 1000 * (0.95^2) = 902.5
    expect(result).toBeCloseTo(902.5, 1)
  })

  it('handles zero principal', () => {
    const result = calculateCompoundInterest(0, 7, 5)
    expect(result).toBe(0)
  })

  it('handles large numbers', () => {
    const result = calculateCompoundInterest(1000000, 7, 10)
    // Should handle without losing precision
    expect(result).toBeGreaterThan(1000000)
    expect(result).toBeCloseTo(1967151.36, -1)
  })
})

describe('calculatePensionYear', () => {
  it('calculates pension year for someone born in 1990 (retirement age 67)', () => {
    const year = calculatePensionYear('1990-01-15')
    // Born 1990 (>= 1973), retires at 67 = 2057
    expect(year).toBe(2057)
  })

  it('calculates pension year for someone born in 1960 (retirement age 65)', () => {
    const year = calculatePensionYear('1960-06-20')
    // Born 1960, retires at 65 = 2025
    expect(year).toBe(2025)
  })

  it('calculates pension year for someone born in 1975 (retirement age 66-67)', () => {
    const year = calculatePensionYear('1975-03-10')
    // Born 1975, between 1961-1973, so retirement age is 65-67
    // This should be 65 + some increment based on year
    expect(year).toBeGreaterThanOrEqual(2040)
    expect(year).toBeLessThanOrEqual(2042)
  })

  it('handles early birth year (before 1961, retirement age 65)', () => {
    const year = calculatePensionYear('1955-12-25')
    expect(year).toBe(2020)
  })

  it('handles late birth year (after 1973, retirement age 67)', () => {
    const year = calculatePensionYear('1980-04-15')
    expect(year).toBe(2047)
  })
})

describe('calculateOpportunityCost', () => {
  it('calculates growth at all timeframes without DOB', () => {
    const result = calculateOpportunityCost(100, 7)

    expect(result.original).toBe(100)
    expect(result.year1).toBeCloseTo(107, 0)
    expect(result.year5).toBeCloseTo(140.26, 1)
    expect(result.year10).toBeCloseTo(196.72, 1)
    expect(result.year20).toBeCloseTo(386.97, 1)
    expect(result.pensionYear).toBeUndefined()
    expect(result.pensionAmount).toBeUndefined()
  })

  it('includes pension year calculation when DOB is provided', () => {
    const result = calculateOpportunityCost(100, 7, '1990-01-15')

    expect(result.original).toBe(100)
    expect(result.year1).toBeCloseTo(107, 0)
    expect(result.pensionYear).toBe(2057)
    expect(result.pensionAmount).toBeDefined()
    // Growth from 2026 (today) to 2057 (31 years) at 7%
    expect(result.pensionAmount!).toBeGreaterThan(result.year20)
  })

  it('uses custom annual rate in calculations', () => {
    const result5pct = calculateOpportunityCost(1000, 5, undefined)
    const result7pct = calculateOpportunityCost(1000, 7, undefined)

    expect(result5pct.year1).toBe(1050)
    expect(result7pct.year1).toBe(1070)
    expect(result5pct.year5).toBeLessThan(result7pct.year5)
  })

  it('handles zero amount', () => {
    const result = calculateOpportunityCost(0, 7)

    expect(result.original).toBe(0)
    expect(result.year1).toBe(0)
    expect(result.year20).toBe(0)
  })

  it('handles person already past retirement (no pension calc if in past)', () => {
    // Born in 1955, retires at 65 = 2020 (already happened)
    // Function only sets pensionYear if yearsToRetirement > 0
    const result = calculateOpportunityCost(1000, 7, '1955-01-01')

    expect(result.pensionYear).toBeUndefined()
    expect(result.pensionAmount).toBeUndefined()
  })

  it('ensures pension year growth is greater than 20-year growth (if in future)', () => {
    const result = calculateOpportunityCost(1000, 7, '1990-01-15')

    if (result.pensionAmount && result.pensionYear && result.pensionYear > new Date().getFullYear()) {
      expect(result.pensionAmount).toBeGreaterThan(result.year20)
    }
  })

  it('maintains precision with decimal amounts', () => {
    const result = calculateOpportunityCost(123.45, 7)

    expect(result.original).toBe(123.45)
    expect(result.year1).toBeCloseTo(132.09, 1)
  })
})
