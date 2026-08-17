import { describe, expect, it } from 'vitest'
import { roundCents } from './money'

describe('roundCents', () => {
  it('rounds a value that floating-point math mis-truncates', () => {
    expect(roundCents(10.005)).toBe(10.01)
  })

  it('rounds down when below the midpoint', () => {
    expect(roundCents(2.494)).toBe(2.49)
  })

  it('handles negative values', () => {
    expect(roundCents(-3.456)).toBe(-3.46)
  })

  it('handles zero', () => {
    expect(roundCents(0)).toBe(0)
  })

  it('leaves whole numbers unchanged', () => {
    expect(roundCents(42)).toBe(42)
  })
})
