import { describe, expect, it } from 'vitest'
import {
  filterByDateRange,
  periodStart,
  startOfMonth,
  sumByCategory,
  type SpendingEntry,
} from './spending'

// entry.date strings are parsed as local dates (see src/lib/dates.ts), so
// the fixtures below use local Date construction too, not ISO/UTC parsing.

function entry(overrides: Partial<SpendingEntry>): SpendingEntry {
  return {
    id: crypto.randomUUID(),
    amount: 10,
    date: '2026-08-01',
    category: 'games',
    ...overrides,
  }
}

describe('sumByCategory', () => {
  it('groups and sums entries by category', () => {
    const result = sumByCategory([
      entry({ category: 'games', amount: 10 }),
      entry({ category: 'games', amount: 5.5 }),
      entry({ category: 'coffee', amount: 4.25 }),
    ])

    expect(result).toEqual([
      { category: 'games', total: 15.5 },
      { category: 'coffee', total: 4.25 },
    ])
  })

  it('returns an empty array for no entries', () => {
    expect(sumByCategory([])).toEqual([])
  })
})

describe('filterByDateRange', () => {
  const entries = [
    entry({ id: 'a', date: '2026-07-31' }),
    entry({ id: 'b', date: '2026-08-01' }),
    entry({ id: 'c', date: '2026-08-15' }),
    entry({ id: 'd', date: '2026-09-01' }),
  ]

  it('includes entries on the start and end boundary', () => {
    const result = filterByDateRange(
      entries,
      new Date(2026, 7, 1),
      new Date(2026, 7, 31, 23, 59, 59),
    )
    expect(result.map((e) => e.id)).toEqual(['b', 'c'])
  })

  it('treats a null start as unbounded', () => {
    const result = filterByDateRange(entries, null, new Date(2026, 7, 1))
    expect(result.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('returns nothing when the range excludes every entry', () => {
    const result = filterByDateRange(
      entries,
      new Date(2020, 0, 1),
      new Date(2020, 0, 31),
    )
    expect(result).toEqual([])
  })
})

describe('startOfMonth', () => {
  it('returns the first day of the given month at midnight', () => {
    const result = startOfMonth(new Date(2026, 7, 15, 13, 30))
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(7)
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(0)
  })
})

describe('periodStart', () => {
  const asOf = new Date(2026, 7, 15)

  it('resolves "month" to the start of the current month', () => {
    const result = periodStart('month', asOf)
    expect(result?.getMonth()).toBe(7)
    expect(result?.getDate()).toBe(1)
  })

  it('resolves "3months" to three calendar months back', () => {
    const result = periodStart('3months', asOf)
    expect(result?.getMonth()).toBe(4)
  })

  it('resolves "6months" to six calendar months back', () => {
    const result = periodStart('6months', asOf)
    expect(result?.getMonth()).toBe(1)
  })

  it('resolves "all" to null (unbounded)', () => {
    expect(periodStart('all', asOf)).toBeNull()
  })
})
