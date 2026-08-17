import { describe, expect, it } from 'vitest'
import { calculateBudget } from './budget'

describe('calculateBudget', () => {
  it('resolves fixed and percentage categories against income', () => {
    const result = calculateBudget(3000, [
      { name: 'rent', type: 'fixed', amount: 1200 },
      { name: 'savings', type: 'percentage', percent: 20 },
    ])

    expect(result.categories).toEqual([
      { name: 'rent', type: 'fixed', amount: 1200 },
      { name: 'savings', type: 'percentage', amount: 600 },
    ])
    expect(result.totalAllocated).toBe(1800)
    expect(result.remaining).toBe(1200)
  })

  it('rescales percentage categories automatically when income changes', () => {
    const categories = [
      { name: 'rent', type: 'fixed' as const, amount: 1200 },
      { name: 'savings', type: 'percentage' as const, percent: 20 },
    ]

    const before = calculateBudget(3000, categories)
    const after = calculateBudget(3500, categories)

    expect(before.categories[1].amount).toBe(600)
    expect(after.categories[1].amount).toBe(700)
    // the fixed category is untouched by the income change
    expect(after.categories[0].amount).toBe(1200)
  })

  it('handles zero income', () => {
    const result = calculateBudget(0, [
      { name: 'savings', type: 'percentage', percent: 20 },
    ])

    expect(result.categories[0].amount).toBe(0)
    expect(result.remaining).toBe(0)
  })

  it('handles negative income without throwing', () => {
    const result = calculateBudget(-500, [
      { name: 'savings', type: 'percentage', percent: 20 },
    ])

    expect(result.categories[0].amount).toBe(-100)
    expect(result.remaining).toBe(-400)
  })

  it('produces a negative remaining balance when over-allocated', () => {
    const result = calculateBudget(1000, [
      { name: 'rent', type: 'fixed', amount: 800 },
      { name: 'car', type: 'fixed', amount: 400 },
    ])

    expect(result.totalAllocated).toBe(1200)
    expect(result.remaining).toBe(-200)
  })

  it('handles an empty category list', () => {
    const result = calculateBudget(2000, [])

    expect(result.categories).toEqual([])
    expect(result.totalAllocated).toBe(0)
    expect(result.remaining).toBe(2000)
  })

  it('rounds fractional-cent percentage splits', () => {
    const result = calculateBudget(100, [
      { name: 'thirds', type: 'percentage', percent: 33.333 },
    ])

    expect(result.categories[0].amount).toBe(33.33)
  })
})
