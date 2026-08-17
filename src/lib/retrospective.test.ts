import { describe, expect, it } from 'vitest'
import { buildRetrospective } from './retrospective'
import type { SpendingEntry } from './spending'

const asOf = new Date(2026, 7, 15)

function entry(overrides: Partial<SpendingEntry>): SpendingEntry {
  return {
    id: crypto.randomUUID(),
    amount: 10,
    date: '2026-08-01',
    category: 'games',
    ...overrides,
  }
}

describe('buildRetrospective', () => {
  it('groups by category and projects each total', () => {
    const rows = buildRetrospective(
      [
        entry({ category: 'games', amount: 20 }),
        entry({ category: 'games', amount: 30 }),
        entry({ category: 'coffee', amount: 15 }),
      ],
      'month',
      10,
      0.07,
      asOf,
    )

    expect(rows).toHaveLength(2)
    const games = rows.find((r) => r.category === 'games')!
    expect(games.totalSpent).toBe(50)
    expect(games.projectedValue).toBeGreaterThan(50)
    expect(games.growth).toBe(games.projectedValue - games.totalSpent)
  })

  it('excludes entries outside the period', () => {
    const rows = buildRetrospective(
      [entry({ date: '2026-01-01' })],
      'month',
      10,
      0.07,
      asOf,
    )
    expect(rows).toEqual([])
  })

  it('excludes zero and negative totals', () => {
    const rows = buildRetrospective(
      [
        entry({ category: 'refunded', amount: -5 }),
        entry({ category: 'refunded', amount: 5 }),
      ],
      'month',
      10,
      0.07,
      asOf,
    )
    expect(rows).toEqual([])
  })

  it('sorts by total spent, highest first', () => {
    const rows = buildRetrospective(
      [
        entry({ category: 'small', amount: 5 }),
        entry({ category: 'big', amount: 100 }),
      ],
      'month',
      10,
      0.07,
      asOf,
    )
    expect(rows.map((r) => r.category)).toEqual(['big', 'small'])
  })
})
