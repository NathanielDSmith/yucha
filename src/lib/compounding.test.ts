import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ANNUAL_RETURN_RATE,
  projectCompoundGrowth,
} from './compounding'

describe('projectCompoundGrowth', () => {
  it('compounds a principal over a standard horizon', () => {
    const result = projectCompoundGrowth(1000, 10, 0.07)

    expect(result.futureValue).toBe(1967.15)
    expect(result.totalGrowth).toBe(967.15)
  })

  it('falls back to the documented default rate when none is given', () => {
    const result = projectCompoundGrowth(1000, 10)

    expect(result.annualRate).toBe(DEFAULT_ANNUAL_RETURN_RATE)
    expect(result.futureValue).toBe(1967.15)
  })

  it('returns the principal unchanged over a zero-year horizon', () => {
    const result = projectCompoundGrowth(500, 0, 0.07)

    expect(result.futureValue).toBe(500)
    expect(result.totalGrowth).toBe(0)
  })

  it('handles a zero principal', () => {
    const result = projectCompoundGrowth(0, 20, 0.07)

    expect(result.futureValue).toBe(0)
    expect(result.totalGrowth).toBe(0)
  })

  it('shrinks the principal under a negative rate', () => {
    const result = projectCompoundGrowth(1000, 5, -0.05)

    expect(result.futureValue).toBe(773.78)
    expect(result.totalGrowth).toBe(-226.22)
  })

  it('stays finite and within a sane range over a very long horizon', () => {
    const result = projectCompoundGrowth(1000, 50, 0.07)

    expect(Number.isFinite(result.futureValue)).toBe(true)
    expect(result.futureValue).toBeGreaterThan(25000)
    expect(result.futureValue).toBeLessThan(35000)
  })

  it('rounds to the nearest cent, rounding half up', () => {
    const result = projectCompoundGrowth(100, 1, 0.03335)

    expect(result.futureValue).toBe(103.34)
    expect(result.totalGrowth).toBe(3.34)
  })
})
