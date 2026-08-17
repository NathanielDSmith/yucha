import { describe, expect, it } from 'vitest'
import { costPerUse, monthsElapsed, totalPaid, type Subscription } from './subscriptions'

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: crypto.randomUUID(),
    name: 'Streaming',
    category: 'subscriptions',
    monthlyAmount: 15,
    startDate: '2026-08-01',
    usageCount: 0,
    ...overrides,
  }
}

describe('monthsElapsed', () => {
  it('counts the start month itself as month 1', () => {
    expect(monthsElapsed('2026-08-01', new Date(2026, 7, 15))).toBe(1)
  })

  it('counts the following month as month 2', () => {
    expect(monthsElapsed('2026-08-01', new Date(2026, 8, 1))).toBe(2)
  })

  it('counts across a year boundary', () => {
    expect(monthsElapsed('2026-08-01', new Date(2027, 7, 1))).toBe(13)
  })

  it('clamps a future start date to 0', () => {
    expect(monthsElapsed('2027-01-01', new Date(2026, 7, 15))).toBe(0)
  })
})

describe('totalPaid', () => {
  it('multiplies the monthly amount by months elapsed', () => {
    const s = sub({ monthlyAmount: 12.5, startDate: '2026-06-01' })
    expect(totalPaid(s, new Date(2026, 7, 15))).toBe(37.5)
  })
})

describe('costPerUse', () => {
  it('returns null when there is no logged usage', () => {
    const s = sub({ usageCount: 0 })
    expect(costPerUse(s, new Date(2026, 7, 15))).toBeNull()
  })

  it('divides total paid by usage count', () => {
    const s = sub({ monthlyAmount: 15, startDate: '2026-06-01', usageCount: 4 })
    // 3 months elapsed (Jun, Jul, Aug) * 15 = 45; 45 / 4 = 11.25
    expect(costPerUse(s, new Date(2026, 7, 15))).toBe(11.25)
  })
})
