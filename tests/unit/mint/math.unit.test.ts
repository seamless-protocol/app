import { describe, expect, it } from 'vitest'
import { applySlippageFloor, mulDivFloor } from '@/domain/mint/planner/math'

describe('math helpers', () => {
  it('applySlippageFloor floors correctly at 0.5%', () => {
    const value = 10000n
    const out = applySlippageFloor(value, 50) // 0.5%
    expect(out).toBe(9950n)
  })

  it('applySlippageFloor with 0% returns same', () => {
    expect(applySlippageFloor(123456n, 0)).toBe(123456n)
  })

  it('mulDivFloor divides floor', () => {
    expect(mulDivFloor(5n, 2n, 3n)).toBe(3n) // 10/3 floored
  })
})
