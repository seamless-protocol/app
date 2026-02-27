import { describe, expect, it } from 'vitest'
import { applySlippageFloor, mulDivFloor } from '@/domain/mint/planner/math'

describe('mulDivFloor', () => {
  it('calculates floor division correctly', () => {
    expect(mulDivFloor(10n, 3n, 4n)).toBe(7n) // (10 * 3) / 4 = 7.5 -> 7
  })
})

describe('applySlippageFloor', () => {
  it('applies slippage correctly', () => {
    expect(applySlippageFloor(1000n, 50)).toBe(950n) // 1000 * (10000 - 50) / 10000 = 950
  })
})